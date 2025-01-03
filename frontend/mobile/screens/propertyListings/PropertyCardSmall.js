import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getImageUriById,
  isPropertyInFavorites,
  addFavoriteProperty,
  removeFavoriteProperty,
  countUsersFavoritedProperty,
} from '../../utils/api';
import { AuthContext } from '../../AuthContext';
import DefaultImage from '../../assets/No-Image-Available.webp';
import * as Animatable from 'react-native-animatable';

const PropertyCard = ({ property, onPress, reloadPropertyCard }) => {
  const [propertyImageUri, setPropertyImageUri] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isBoostActive, setIsBoostActive] = useState(false); // Added state for boost status
  const { user } = useContext(AuthContext);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const cardSize = Dimensions.get('window').width;

  const formatPrice = (price) => {
    if (price !== null && !isNaN(price)) {
      const formattedPrice = price.toFixed(2);
      return formattedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
      return 'N/A';
    }
  };

  const fetchFavoriteCount = async () => {
    // console.log('Favorite count:', property.favoriteCount);
    // setFavoriteCount(property.favoriteCount);
    const { success, data, message } = await countUsersFavoritedProperty(property.propertyListingId);
    if (success) {
      setFavoriteCount(data.count);
    } else {
      console.error('Error fetching favorite count:', message);
    }
  };

  useEffect(() => {
    if (property.images && property.images.length > 0) {
      const imageIds = property.images.map(Number);
      const smallestImageId = Math.min(...imageIds);
      const imageUri = getImageUriById(smallestImageId.toString());
      setPropertyImageUri(imageUri);
    }

    // Calculate boost status and fetch property favorite status/count
    setCacheBuster(Date.now());
    checkIfPropertyIsFavorite();
    calculateBoostStatus();
    // fetchPropertyDetails();
    fetchFavoriteCount();
  }, [property]);

  const calculateBoostStatus = () => {
    if (property.boostListingEndDate) {
      const currentDate = new Date();
      const boostEndDate = new Date(property.boostListingEndDate);
      setIsBoostActive(boostEndDate >= currentDate); // Check if boost is active
    } else {
      setIsBoostActive(false); // No boost end date means not active
    }
  };

  const checkIfPropertyIsFavorite = async () => {
    const userId = user.user.userId;
    try {
        const { success, data } = await isPropertyInFavorites(userId, property.propertyListingId);

        if (success) {
            setIsFavorite(data.isLiked);
            setFavoriteCount(data.favoriteCount); // Set the favorite count from the API response
        } else {
            console.error('Error checking if property is in favorites:', data.message);
        }
    } catch (error) {
        console.error('Error checking if property is in favorites:', error);
    }
};

  const fetchPropertyDetails = async () => {
    const userId = user.user.userId;

    const [favoriteStatusResponse, favoriteCountResponse] = await Promise.all([
      isPropertyInFavorites(userId, property.propertyListingId),
      countUsersFavoritedProperty(property.propertyListingId),
    ]);

    if (favoriteStatusResponse.success) {
      setIsFavorite(favoriteStatusResponse.data.isLiked);
    } else {
      console.error('Error checking if property is in favorites:', favoriteStatusResponse.data.message);
    }

    if (favoriteCountResponse.success) {
      setFavoriteCount(favoriteCountResponse.data.count);
    } else {
      console.error('Error fetching favorite count:', favoriteCountResponse.message);
    }
  };

  const handleFavoriteButtonPress = async () => {
    if (isFavorite) {
      const { success } = await removeFavoriteProperty(user.user.userId, property.propertyListingId);

      if (success) {
        setIsFavorite(false);
        setFavoriteCount((prevCount) => prevCount - 1);
      } else {
        console.error('Error removing property from favorites');
      }
    } else {
      const { success } = await addFavoriteProperty(user.user.userId, property.propertyListingId);

      if (success) {
        setIsFavorite(true);
        setFavoriteCount((prevCount) => prevCount + 1);
      } else {
        console.error('Error adding property to favorites');
      }
    }
  };

  const [currentColor, setCurrentColor] = useState('blue'); // Initial color
  const colors = ['red', 'green', 'blue', 'orange']; // Define your desired colors
  const animationDuration = 1000; // Duration for each color change (in milliseconds)

  useEffect(() => {
    // Create a timer to change the color at regular intervals
    const colorChangeTimer = setInterval(() => {
      // Get the next color in the array
      const nextColorIndex = (colors.indexOf(currentColor) + 1) % colors.length;
      const nextColor = colors[nextColorIndex];
      setCurrentColor(nextColor);
    }, animationDuration);

    // Clear the timer when the component unmounts
    return () => clearInterval(colorChangeTimer);
  }, [currentColor]);

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardSize * 0.8, height: cardSize * 0.8 }]}
      onPress={() => onPress(property.propertyId)}
    >
      <View style={styles.imageContainer}>
        {propertyImageUri ? (
          <Image source={{ uri: `${propertyImageUri}?timestamp=${cacheBuster}` }} style={styles.propertyImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Image source={DefaultImage} style={styles.placeholderImageImage} />
          </View>
        )}
      </View>
      <View style={styles.propertyDetails}>
        <Text style={styles.propertyTitle}>{property.title}</Text>
        <Text style={styles.propertyPrice}>${formatPrice(property.price)}</Text>
        <Text style={styles.propertyInfo}>
          {property.bed} <Ionicons name="bed" size={16} color="#333" /> |
          {property.bathroom} <Ionicons name="water" size={16} color="#333" /> |
          {property.size} sqm <Ionicons name="cube-outline" size={16} color="#333" />
        </Text>
        <View style={styles.favoriteButton}>
          {isBoostActive && (
            <Animatable.View animation="jello" easing="ease-out" iterationCount="infinite">
                <Ionicons
                  name="flash"
                  size={24}
                  color={currentColor}
                  style={{ marginRight: 4 }}
                />
            </Animatable.View>
          )}
          <TouchableOpacity onPress={handleFavoriteButtonPress}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? 'red' : '#333'}
              style={{ marginRight: 4 }} // Adjust as needed
            />
          </TouchableOpacity>
          <Text style={{ color: isFavorite ? 'red' : '#333', fontSize: 16, fontWeight: 'bold' }}>
            {favoriteCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    alignSelf: 'center', // Center the card
    marginVertical: 10, // A little margin top and bottom for spacing between cards
    borderRadius: 10,
    borderWidth: 0.5, // Light border
    borderColor: '#ddd', // Light gray color
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 7,
    marginLeft: 10,
  },
  imageContainer: {
    width: '100%',
    height: '60%',
    overflow: 'hidden', // Hide overflow
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10
  },
  propertyDetails: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  propertyPrice: {
    fontSize: 16,
    color: '#333',
  },
  propertyInfo: {
    fontSize: 12,
    color: '#555',
  },
  propertyListing: {
    flexDirection: 'row',
    marginBottom: 20, // Adjust this value to control the spacing between cards
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  placeholderImage: {
    borderRadius: 20,

  },
  placeholderImageImage: {
    width: '100%', // Adjust the width as needed to match the desired size
    height: '80%', // Adjust the height as needed to match the desired size
    marginBottom: 80,
    borderRadius: 10,
  },
  favoriteContainer: {
    // flexDirection: 'row',
    // alignItems: 'left',
    // marginTop: 8, // Adjust the spacing as needed
  },
  favoriteCount: {
    marginTop: 40, // Adjust the spacing between icon and count as needed
    fontSize: 16,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end', // Align to the right
  },
});

export default PropertyCard;
