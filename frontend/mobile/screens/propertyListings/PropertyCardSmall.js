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

const PropertyCard = ({ property, onPress }) => {
  const [propertyImageUri, setPropertyImageUri] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0); // Added state for favorite count
  const { user } = useContext(AuthContext);
  const cardSize = Dimensions.get('window').width;

  const formatPrice = (price) => {
    if (price !== null && !isNaN(price)) {
      const formattedPrice = price.toFixed(2); // Format to 2 decimal places
      return formattedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
      return 'N/A'; // Handle the case when price is null, undefined, or not a number
    }
  };

      const fetchFavoriteCount = async () => {
        const { success, data, message } = await countUsersFavoritedProperty(property.propertyListingId);
        console.log('countUsersFavoritedProperty:', success, data, message);
        if (success) {
            setFavoriteCount(data.count); // Assuming the count is in data.count
        } else {
            console.error('Error fetching favorite count:', message);
        }
    };

  useEffect(() => {
    console.log( "for property id", property.propertyListingId, "for name: ", property.title, "for length: ", 
    property.images.length, 'property.images:', property.images,)
    if (property.images && property.images.length > 0) {
      const imageIds = property.images.map(Number);
      const smallestImageId = Math.min(...imageIds);
      const timestamp = new Date().getTime();
      const imageUri = getImageUriById(smallestImageId.toString());
      setPropertyImageUri(imageUri);
    }

    // Fetch property favorite status and count in parallel
    fetchPropertyDetails();
  }, [property]);

  const fetchPropertyDetails = async () => {
    const userId = user.user.userId;

    // Fetch favorite status and favorite count in parallel
    const [favoriteStatusResponse, favoriteCountResponse] = await Promise.all([
      isPropertyInFavorites(userId, property.propertyListingId),
      countUsersFavoritedProperty(property.propertyListingId),
    ]);

    // Handle favorite status response
    if (favoriteStatusResponse.success) {
      setIsFavorite(favoriteStatusResponse.data.isLiked);
    } else {
      console.error('Error checking if property is in favorites:', favoriteStatusResponse.data.message);
    }

    // Handle favorite count response
    if (favoriteCountResponse.success) {
      setFavoriteCount(favoriteCountResponse.data.count);
    } else {
      console.error('Error fetching favorite count:', favoriteCountResponse.message);
    }
  };

  const handleFavoriteButtonPress = async () => {
    if (isFavorite) {
      // Remove the property from favorites
      const { success } = await removeFavoriteProperty(user.user.userId, property.propertyListingId);

      if (success) {
        setIsFavorite(false);
        setFavoriteCount((prevCount) => prevCount - 1);
      } else {
        console.error('Error removing property from favorites');
      }
    } else {
      // Add the property to favorites
      const { success } = await addFavoriteProperty(user.user.userId, property.propertyListingId);

      if (success) {
        setIsFavorite(true);
        setFavoriteCount((prevCount) => prevCount + 1);
      } else {
        console.error('Error adding property to favorites');
      }
    }
  };

  return (
    <TouchableOpacity style={[styles.card, { width: cardSize * 0.8, height: cardSize * 0.8 }]} onPress={() => onPress(property.propertyId)}>
      <View style={styles.imageContainer}>
        {propertyImageUri ? (
          <Image source={{ uri: propertyImageUri }} style={styles.propertyImage} />
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
