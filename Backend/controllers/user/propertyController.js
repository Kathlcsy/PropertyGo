const { Property, Image } = require('../../models');
const sharp = require('sharp');

// Get all properties
async function getAllProperties(req, res) {
    try {
        const properties = await Property.findAll();
        
        const propertiesWithImages = properties.map(property => {
            const propertyJSON = property.toJSON();
            if (propertyJSON.images) {
                propertyJSON.images = propertyJSON.images.toString('base64');
            }
            return propertyJSON;
        });

        res.json(propertiesWithImages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching properties' });
    }
}

// Create a property
// Modify the createProperty function to handle multiple images
async function createProperty(req, res) {
    const propertyData = JSON.parse(req.body.property);
    console.log(propertyData);
    try {
        const images = req.files;

        if (images.length === 0) {
            return res.status(400).json({ error: 'No images selected' });
        }

        // Populate required fields for the property
        propertyData.postedAt = new Date(); // Set the postedAt date

        // Create the property in the database
        const createdProperty = await Property.create(propertyData);

        // Create and associate images with the property
        await Promise.all(
            images.map(async (image, index) => {
                const processedImageBuffer = await sharp(image.buffer)
                    .resize({ width: 800 }) // You can set the dimensions accordingly
                    .webp()
                    .toBuffer();

                const imageData = {
                    title: `Image ${index + 1}`,
                    image: processedImageBuffer,
                    propertyId: createdProperty.propertyListingId, // Associate the image with the created property
                };

                const createdImage = await Image.create(imageData);
            })
        );

        res.json({ propertyListingId: createdProperty.propertyListingId });
    } catch (error) {
        console.error('Error creating property:', error);
        res.status(500).json({ error: 'Error creating property' });
    }
}


// Update a property
async function updateProperty(req, res) {
    const propertyId = req.params.id;
    const updatedPropertyData = req.body;

    try {
        const property = await Property.findByPk(propertyId);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (req.file) {
            const processedImageBuffer = await sharp(req.file.buffer)
                .resize({ width: 800 }) // You can set the dimensions accordingly
                .webp()
                .toBuffer();

            updatedPropertyData.images = processedImageBuffer;
        }

        await property.update(updatedPropertyData);

        res.json(property);
    } catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({ error: 'Error updating property' });
    }
}

module.exports = {
    getAllProperties,
    createProperty,
    updateProperty
};
