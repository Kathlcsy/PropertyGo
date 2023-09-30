const { User, Property, Image } = require('../../models');
const sharp = require('sharp');

async function getAllUsers(req, res) {
  try {
    const listOfUser = await User.findAll({
      attributes: {
        include: [
          [sequelize.json('profileImage'), 'profileImage']
        ]
      }
    });

    const usersWithProfileImages = listOfUser.map(user => {
      const userJSON = user.toJSON();
      if (userJSON.profileImage) {
        userJSON.profileImage = userJSON.profileImage.toString('base64');
      }
      return userJSON;
    });

    res.json(usersWithProfileImages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
}

async function createUser(req, res) {
  const user = req.body;
  try {
    // Check if the username already exists
    const existingUser = await User.findOne({
      where: {
        userName: user.userName
      }
    });

    // Check if the email already exists
    const existingEmail = await User.findOne({
      where: {
        email: user.email
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // If neither the username nor email exists, create the user
    const createdUser = await User.create(user);

    if (req.file) {
      const profileImage = req.file.buffer;
      await createdUser.update({ profileImage });
      res.json(createdUser);
    } else {
      res.json(createdUser);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
}

async function updateUser(req, res) {
  const userId = req.params.id;
  const updatedUserData = req.body;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingEmail = await User.findOne({
      where: {
        email: updatedUserData.email
      }
    });

    if (existingEmail && updatedUserData.email !== user.email) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    if (req.file) {
      updatedUserData.profileImage = req.file.buffer;
    }

    await user.update(updatedUserData);

    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Error updating user profile' });
  }
}

async function uploadProfilePicture(req, res) {
  const userId = req.params.userId;

  try {
    const profileImage = req.file;

    if (!profileImage) {
      return res.status(400).json({ error: 'No profile image provided' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const processedImageBuffer = await sharp(profileImage.buffer)
      .resize({ width: 200, height: 200 })
      .webp()
      .toBuffer();

    user.profileImage = processedImageBuffer;
    await user.save();

    res.json({ success: true, message: 'Profile image uploaded successfully' });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Error uploading profile picture' });
  }
}

async function getUserById(req, res) {
  const userId = req.params.userId;

  try {
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password'], // Exclude sensitive data like password
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
}

async function addFavoriteProperty(req, res) {
  try {
    const { userId, propertyId } = req.params;

    // Find the user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the property by ID
    const property = await Property.findByPk(propertyId);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Add the property to the user's favorites
    await user.addFavouriteProperty(property);

    res.status(201).json({ message: 'Property added to favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function removeFavoriteProperty(req, res) {
  try {
    const { userId, propertyId } = req.params;

    // Find the user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the property by ID
    const property = await Property.findByPk(propertyId);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Remove the property from the user's favorites
    await user.removeFavouriteProperty(property);

    res.status(200).json({ message: 'Property removed from favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getUserFavorites(req, res) {
  try {
    const { userId } = req.params;

    // Find the user by ID and include their favorite properties
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Property,
          as: 'favouriteProperties',
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create an array to store user's favorite properties with image IDs
    const favoritePropertiesWithImages = [];

    // Loop through the user's favorite properties
    for (const property of user.favouriteProperties) {
      // Find the associated images for the property
      const images = await Image.findAll({ where: { propertyId: property.propertyListingId } });

      // Map image IDs
      const imageIds = images.map((image) => image.imageId);

      // Create a property object with image IDs
      const propertyWithImages = {
        ...property.toJSON(),
        images: imageIds,
      };

      // Add the property object to the array
      favoritePropertiesWithImages.push(propertyWithImages);
    }

    // Respond with the user's favorite properties including image IDs
    res.json(favoritePropertiesWithImages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function isPropertyInFavorites(req, res) {
  try {
    const { userId, propertyId } = req.params;

    // Find the user by ID and include their favorite properties
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Property,
          as: 'favouriteProperties',
          where: { propertyListingId: propertyId }, // Check if the property with the given ID exists in favorites
          required: false, // Use "required: false" to perform a left join
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the property exists in the user's favorite properties
    const isLiked = user.favouriteProperties.length > 0;

    res.json({ isLiked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}



module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  uploadProfilePicture,
  getUserById,
  addFavoriteProperty,
  removeFavoriteProperty,
  getUserFavorites,
  isPropertyInFavorites,
};
