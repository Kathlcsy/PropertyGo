import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Swiper from 'react-native-swiper';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { editProperty, getPropertyListing, getImageUriById } from '../../utils/api';
import DefaultImage from '../../assets/No-Image-Available.webp';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import base64 from 'react-native-base64';
import { getAreaAndRegion } from '../../services/GetAreaAndRegion';

const EditPropertyListing = ({ route }) => {
  const { propertyListingId } = route.params;
  const [images, setImages] = useState([]);
  const navigation = useNavigation();
  const [propertyTypeVisible, setPropertyTypeVisible] = useState(false);
  const { user } = useContext(AuthContext);
  const [propertyListing, setPropertyListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formattedPrice, setFormattedPrice] = useState('');
  const [rawPrice, setRawPrice] = useState('');
  const [propertyData, setPropertyData] = useState({
    title: '',
    description: '',
    price: '',
    bed: '',
    bathroom: '',
    size: '',
    postalCode: '',
    address: '',
  });

  const [property, setProperty] = useState({
  });

  const propertyTypes = [
    { label: 'Select Property Type', value: '' },
    { label: 'Resale', value: 'Resale' },
    { label: 'New Launch', value: 'New Launch' },
  ]

  // Function to format the price with dollar sign and commas
  const formatPrice = (price) => {
    return `$${price.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`;
  };

  // Function to remove dollar sign and commas and save raw price
  const handlePriceChange = (text) => {
    const raw = text.replace(/[^0-9]/g, '');
    setFormattedPrice(formatPrice(raw));
    setRawPrice(raw);
  };

  const handleSubmit = async () => {
    // Validation checks
    if (images.length === 0) {
      Alert.alert('No images selected', 'Please select at least one image.');
      return;
    }

    // Parse the formatted price to remove dollar sign and commas
    const price = rawPrice ? parseInt(rawPrice, 10) : 0;

    if (!price || price <= 0) {
      Alert.alert('Invalid Price', 'Price must be a numeric value.');
      return;
    }

    if (!/^\d+$/.test(property.size)) {
      Alert.alert('Invalid Size', 'Size must be a numeric value.');
      return;
    }

    if (!/^\d+$/.test(property.bed)) {
      Alert.alert('Invalid Bed', 'Bed must be a numeric value.');
      return;
    }

    if (!/^\d+$/.test(property.bathroom)) {
      Alert.alert('Invalid Bathroom', 'Bathroom must be a numeric value.');
      return;
    }

    if (property.propertyType === '') {
      Alert.alert('Property Type Not Selected', 'Please select a property type.');
      return;
    }

    if (
      property.title.trim() === '' ||
      property.description.trim() === '' ||
      property.unitNumber.trim() === '' ||
      property.postalCode.trim() === '' ||
      property.address.trim() === ''
    ) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    // Other checks and API call
    let propertyTypeUpperCase = property.propertyType.toUpperCase();
    if (propertyTypeUpperCase === 'NEW LAUNCH') {
      propertyTypeUpperCase = 'NEW_LAUNCH';
    }

    try {
      const { success, data, message } = await createProperty(
        {
          ...property,
          price: price, // Use the parsed price here
          offeredPrice: property.offeredPrice.replace(/\$/g, ''),
          propertyType: propertyTypeUpperCase,
        },
        images
      );

      if (success) {
        const propertyListingId = data.propertyListingId;
        console.log('Property created successfully:', propertyListingId);
        Alert.alert(
          'Property Created',
          'The property listing has been created successfully.'
        );
        navigation.navigate('Property Listing', { propertyListingId });
      } else {
        Alert.alert('Error', `Failed to create property: ${message}`);
      }
    } catch (error) {
      console.log('Error uploading property:', error);
      Alert.alert(
        'Error',
        'An error occurred while creating the property listing.'
      );
    }
  };

  // Function to fetch address based on postal code
  const fetchAddressByPostalCode = async (postalCode) => {
    if (postalCode.length === 6) {
      try {
        const response = await fetch(
          `https://developers.onemap.sg/commonapi/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.found === 1) {
            const address = data.results[0].ADDRESS;
            const { area, region } = await getAreaAndRegion(postalCode);

            // Update the postalCode field in the property state
            setPropertyData({
              ...propertyData,
              postalCode, // Update postalCode with the new value
              address,
              area,
              region,
            });
          } else {
            Alert.alert('Invalid Postal Code', 'No address found for the postal code.');
            setPropertyData({ ...propertyData, postalCode: '', address: '' }); // Clear postalCode and address
          }
        } else {
          console.error('API request failed.');
        }
      } catch (error) {
        console.error('Error fetching address:', error);
      }
    }
  };

  // Event listener for postal code input
  const handlePostalCodeChange = (text) => {
    // Restrict input to a maximum of 6 digits
    if (/^\d{0,6}$/.test(text)) {
      // Update the postalCode field in the property state
      setPropertyData({
        ...propertyData,
        postalCode: text, // Update postalCode with the new value
      });

      // Call the function to fetch the address
      if (text.length === 6) {
        fetchAddressByPostalCode(text);
      }
    }
  };


  useEffect(() => {
    // Fetch property listing details using propertyListingId from your API
    fetchPropertyListing(propertyListingId);
  }, [propertyListingId]);

  const fetchPropertyListing = async (id) => {
    try {
      // Make an API call to fetch property listing details by id
      const response = await fetch(getPropertyListing(id));
      const data = await response.json();
      setPropertyListing(data); // Update state with the fetched data

      // Update the property data fields with fetched data
      setPropertyData({
        title: data.title,
        description: data.description,
        price: data.price.toString(),
        bed: data.bed.toString(),
        bathroom: data.bathroom.toString(),
        size: data.size.toString(),
        postalCode: data.postalCode.toString() || '', // Update postalCode (or provide a default value)
        address: data.address,
        unitNumber: data.unitNumber || '', // Update unitNumber (or provide a default value)
        propertyType: transformPropertyType(data.propertyType), // Transform propertyType label
      });

      // Update formattedPrice with the fetched price
      setFormattedPrice(formatPrice(data.price.toString()));

      // Set isLoading to false here
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching property listing:', error);
      setIsLoading(false); // Ensure that isLoading is set to false even on error
    }
  };


  // Function to transform property type label
  const transformPropertyType = (type) => {
    if (type === 'NEW_LAUNCH') {
      return 'New Launch';
    } else {
      return 'Resale'
    }
    // Handle other property type cases here if needed
    return type; // Return the type unchanged if not matched
  };

  const handleSaveChanges = async () => {
    try {
      const response = await editProperty(propertyListingId, propertyData, []);
      if (response.success) {
        // Property updated successfully, navigate back to the property listing screen
        navigation.navigate('PropertyListingScreen', { propertyListingId });
      } else {
        console.error('Error updating property:', response.message);
        // Handle the error appropriately, e.g., show an error message to the user
      }
    } catch (error) {
      console.error('Error updating property:', error);
      // Handle the error appropriately, e.g., show an error message to the user
    }
  };

  const handleChoosePhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      console.warn('Permission to access photos was denied');
      return;
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    };

    let response = await ImagePicker.launchImageLibraryAsync(options);

    if (!response.cancelled) {
      setImages([...images, response]);
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loadingIndicator} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>List A Property</Text>
        </View>

        <View style={styles.imageRow}>
          <ScrollView horizontal={true}>
            {/* Add a View to hold the Add Image button */}
            <View>
              <TouchableOpacity onPress={handleChoosePhoto} style={styles.imagePicker}>
                <Icon name="camera" size={40} color="#aaa" />
              </TouchableOpacity>
            </View>

            {/* Map over the images */}
            {images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleImagePress(index)}
                style={styles.imageContainer}
              >
                <Image source={{ uri: image.uri }} style={styles.image} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            placeholder="Title"
            value={propertyData.title}
            onChangeText={(text) =>
              setPropertyData({ ...propertyData, title: text }) // Fix the object reference to propertyData
            }
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price</Text>
          <TextInput
            placeholder="$ Price"
            value={formattedPrice}
            onChangeText={handlePriceChange}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Size (sqm)</Text>
          <TextInput
            placeholder="Size (sqm)"
            value={propertyData.size}
            onChangeText={(text) =>
              setPropertyData({ ...propertyData, size: text }) // Fix the object reference to propertyData
            }
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bed</Text>
          <TextInput
            placeholder="Bed"
            value={propertyData.bed}
            onChangeText={(text) =>
              setPropertyData({ ...propertyData, bed: text }) // Fix the object reference to propertyData
            }
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bathroom</Text>
          <TextInput
            placeholder="Bathroom"
            value={propertyData.bathroom}
            onChangeText={(text) =>
              setPropertyData({ ...propertyData, bathroom: text }) // Fix the object reference to propertyData
            }
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Postal Code</Text>
          <TextInput
            placeholder="Postal Code"
            maxLength={6}
            keyboardType="numeric"
            value={propertyData.postalCode} // Display the postalCode from propertyData
            onChangeText={handlePostalCodeChange}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            placeholder="Address"
            value={propertyData.address}
            onChangeText={(text) =>
              setPropertyData({ ...propertyData, address: text }) // Fix the object reference to propertyData
            }
            style={[styles.input, styles.mediumTypeInput]}
            multiline={true}
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Unit Number</Text>
          <TextInput
            placeholder="Unit Number"
            value={propertyData.unitNumber}
            onChangeText={(text) =>
              setPropertyData({ ...propertyData, unitNumber: text }) // Fix the object reference to propertyData
            }
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Description"
            value={propertyData.description}
            onChangeText={(text) =>
              setPropertyData({ ...propertyData, description: text }) // Fix the object reference to propertyData
            }
            style={[styles.input, styles.largeTextInput]}
            multiline={true}
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Property Type</Text>
          <TouchableOpacity
            style={styles.propertyTypePickerButton}
            onPress={() => setPropertyTypeVisible(true)}
          >
            <Text style={styles.propertyTypePickerText}>
              {propertyData.propertyType
                ? propertyData.propertyType.charAt(0).toUpperCase() +
                propertyData.propertyType.slice(1)
                : 'Select Property Type'}
            </Text>
            <Icon name="caret-down" size={20} color="black" />
          </TouchableOpacity>
        </View>

        <Modal
          transparent={true}
          animationType="slide"
          visible={propertyTypeVisible}
          onRequestClose={() => setPropertyTypeVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Picker
              selectedValue={propertyData.propertyType}
              onValueChange={(value) =>
                setPropertyData({ ...property, propertyType: value })
              }
              style={styles.picker}
            >
              {propertyTypes.map((type, index) => (
                <Picker.Item
                  key={index}
                  label={type.label}
                  value={type.value}
                />
              ))}
            </Picker>
            <View style={styles.okButtonContainer}>
              <Button
                title="OK"
                onPress={() => setPropertyTypeVisible(false)}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>

      <TouchableOpacity style={styles.saveChangesButton} onPress={handleSubmit}>
        <Ionicons name="save-outline" size={18} color="white" />
        <Text style={styles.saveChangesButtonText}>Submit</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
    marginBottom: 10, // Adjust this margin to avoid overlap with the navigation bar
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
    height: 40,
    borderRadius: 5,
  },
  largeTextInput: {
    height: 120,
  },
  mediumTypeInput: {
    height: 60,
  },
  imageRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 10,
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ddd',
    width: 100,
    height: 100,
    marginRight: 10,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
  },
  propertyTypePickerButton: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    borderColor: 'gray',
    fontSize: 14,
    padding: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyTypePickerText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingBottom: 20, // Add padding to make the button visible
  },
  picker: {
    backgroundColor: 'white',
  },
  okButtonContainer: {
    backgroundColor: 'white',
  },
  saveChangesButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center', // Center horizontally
    flexDirection: 'row',
    justifyContent: 'center', // Center vertically
    width: '60%',
    marginLeft: 70,
  },
  saveChangesButtonText: {
    color: 'white',
    marginLeft: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 90,
  },
});

export default EditPropertyListing;
