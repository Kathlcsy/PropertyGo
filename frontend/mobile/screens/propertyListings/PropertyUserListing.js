import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Swiper from 'react-native-swiper';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Entypo, FontAwesome5, MaterialCommunityIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import {
  getPropertyListing, getImageUriById, getUserById, addFavoriteProperty,
  removeFavoriteProperty, isPropertyInFavorites, countUsersFavoritedProperty, removeProperty
} from '../../utils/api';
import base64 from 'react-native-base64';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import DefaultImage from '../../assets/No-Image-Available.webp';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FullScreenImage from './FullScreenImage';
import PredictionPriceCard from './PredictionPriceCard';


const PropertyUserListingScreen = ({ route }) => {
  const { propertyListingId } = route.params;
  const navigation = useNavigation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [propertyListing, setPropertyListing] = useState(null);
  const [userDetails, setUser] = useState(null);
  const { user } = useContext(AuthContext);
  const isCurrentUserPropertyOwner = userDetails && userDetails.userId === user.user.userId;
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [region, setRegion] = useState({
    latitude: 1.36922522142582,
    longitude: 103.848493192474,
    latitudeDelta: 0.005, // Adjust initial zoom level
    longitudeDelta: 0.005,
  });

  useFocusEffect(
    React.useCallback(() => {
      console.log('Home page gained focus');
      fetchPropertyListing(propertyListingId);
      checkIfPropertyIsFavorite();
      fetchFavoriteCount();
      setCacheBuster(Date.now());
    }, [])
  );

  const handleDeleteListing = async () => {
    // Show an alert to confirm deletion
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this property listing?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const { success, message } = await removeProperty(propertyListingId);

              if (success) {
                // Property deleted successfully, navigate back to the previous screen
                navigation.goBack();
              } else {
                console.error('Error deleting property:', message);
                // Handle the error appropriately, e.g., show an error message to the user
              }
            } catch (error) {
              console.error('Error deleting property:', error);
              // Handle the error appropriately, e.g., show an error message to the user
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Fetch the number of users who have favorited the property
  const fetchFavoriteCount = async () => {
    const { success, data, message } = await countUsersFavoritedProperty(propertyListingId);
    if (success) {
      setFavoriteCount(data.count); // Assuming the count is in data.count
    } else {
      console.error('Error fetching favorite count:', message);
    }
  };

  const fetchUser = async (userId) => {
    console.log('Fetching user with ID:', userId);
    const { success, data, message } = await getUserById(userId);

    if (success) {
      // Handle the user data here
      console.log('User Data:', data);
      return data;
    } else {
      // Handle the error here
      console.error('Error fetching user:', message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  };

  useEffect(() => {
    // Fetch property listing details including image IDs using propertyListingId from your API
    // Make an API call to retrieve the property details
    console.log('Received propertyListingId:', propertyListingId);
    fetchPropertyListing(propertyListingId);
    checkIfPropertyIsFavorite();
    fetchFavoriteCount();
    setCacheBuster(Date.now());
  }, [propertyListingId]);

  const checkIfPropertyIsFavorite = async () => {
    const userId = user.user.userId;
    // Check if the property is in favorites and update the isFavorite state
    const { success, data, message } = await isPropertyInFavorites(
      userId, // Pass the user ID
      propertyListingId // Pass the property ID
    );

    console.log('isPropertyInFavorites:', success, data, message);

    if (success) {
      setIsFavorite(data.isLiked);
    } else {
      console.error('Error checking if property is in favorites:', message);
    }
  };

  const handleFavoriteButtonPress = async () => {
    if (isFavorite) {
      // Remove the property from favorites
      const { success, message } = await removeFavoriteProperty(
        userDetails.userId, // Pass the user ID
        propertyListingId // Pass the property ID
      );

      if (success) {
        setIsFavorite(false);
        setFavoriteCount((prevCount) => prevCount - 1);
      } else {
        console.error('Error removing property from favorites:', message);
      }
    } else {
      // Add the property to favorites
      const { success, message } = await addFavoriteProperty(
        userDetails.userId, // Pass the user ID
        propertyListingId // Pass the property ID
      );

      if (success) {
        setIsFavorite(true);
        setFavoriteCount((prevCount) => prevCount + 1);
      } else {
        console.error('Error adding property to favorites:', message);
      }
    }
  };

  const fetchPropertyListing = async (id) => {
    try {
      // Make an API call to fetch property listing details by id
      const response = await fetch(getPropertyListing(id));
      const data = await response.json();
      const userDetailsData = await fetchUser(data.sellerId);
      setUser(userDetailsData); // Update user details state
      setPropertyListing(data); // Update state with the fetched data
      // Fetch latitude and longitude based on postal code
      // fetchLatitudeLongitudeByPostalCode(data.postalCode);
      setApprovalStatus(data.approvalStatus);
      const latitude = data.latitude;
      const longitude = data.longitude;
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005, // Adjust these values for initial zoom level
        longitudeDelta: 0.005,
      });
    } catch (error) {
      console.error('Error fetching property listing:', error);
    }
  };

  //not in use
  const fetchLatitudeLongitudeByPostalCode = async (postalCode) => {
    try {
      // Make an API call to fetch latitude and longitude based on postal code
      const response = await fetch(
        `https://developers.onemap.sg/commonapi/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.found === 1) {
          // Extract the latitude and longitude from the API response
          const latitude = parseFloat(data.results[0].LATITUDE);
          const longitude = parseFloat(data.results[0].LONGITUDE);

          // Update the region state with obtained values
          setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.005, // Adjust these values for initial zoom level
            longitudeDelta: 0.005,
          });
        } else {
          console.error('No address found for the postal code.');
        }
      } else {
        console.error('API request failed.');
      }
    } catch (error) {
      console.error('Error fetching latitude and longitude:', error);
    }
  };

  if (!propertyListing) {
    return <ActivityIndicator style={styles.loadingIndicator} size="large" color="#00adf5"/>;
  }

  let profileImageBase64;
  if (userDetails && userDetails.profileImage && userDetails.profileImage.data) {
    profileImageBase64 = base64.encodeFromByteArray(userDetails.profileImage.data);
  }

  const formatPriceWithCommas = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatPricePerSqm = (price, size) => {
    if (price !== null && size !== null && !isNaN(price) && !isNaN(size) && size !== 0) {
      const pricePerSqm = (price / size).toFixed(2); // Format to 2 decimal places
      return pricePerSqm;
    } else {
      return 'N/A'; // Handle the case when price or size is null, undefined, or 0
    }
  };

  const getStatusText = (status, propertyStatus) => {
    if (propertyStatus === 'ACTIVE') {
      switch (status) {
        case 'PENDING':
          return 'Awaiting Admin Approval';
        case 'APPROVED':
          return 'Approved';
        case 'REJECTED':
          return 'Rejected';
        default:
          return status; // Default status text
      }
    } else {
      switch (propertyStatus) {
        case 'ON_HOLD':
          return 'On Hold';
        case 'COMPLETED':
          return 'Sold';
        default:
          return status; // Default status text
      }
    }
  };

  const getStatusColor = (status, propertyStatus) => {
    if (propertyStatus === 'ACTIVE') {
      switch (status) {
        case 'PENDING':
          return 'yellow';
        case 'APPROVED':
          return 'green';
        case 'REJECTED':
          return 'red';
        default:
          return 'blue'; // Default status text
      }
    } else {
      switch (propertyStatus) {
        case 'ON_HOLD':
          return 'yellow';
        case 'COMPLETED':
          return 'red';
        default:
          return status; // Default status text
      }
    }
  };

  const getStatusTextColor = (status, propertyStatus) => {
    if (propertyStatus === 'ACTIVE') {
      switch (status) {
        case 'PENDING':
          return 'black';
        default:
          return 'white'; // Default color
      }
    } else { 
      switch (propertyStatus) {
        case 'ON_HOLD':
          return 'black';
        default:
          return 'white'; // Default color
      }
    }
  };

  const capitalizeWords = (str) => {
    return str.toLowerCase().replace(/(?:^|\s)\w/g, function (match) {
      return match.toUpperCase();
    });
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        <View style={styles.imageGalleryContainer}>
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Swiper style={styles.wrapper} showsButtons={false} loop={false} autoplay={true} autoplayTimeout={5}>
            {propertyListing.images.length > 0 ? (
              propertyListing.images.map((imageId, index) => {
                const imageUri = getImageUriById(imageId);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setFullScreenImage(imageUri)} // Set the fullScreenImage state when tapped
                    style={styles.slide} // Apply styles to TouchableOpacity
                  >
                    <Image source={{ uri: `${imageUri}?timestamp=${cacheBuster}` }} style={styles.image} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.slide}>
                <Image source={DefaultImage} style={styles.image} />
              </View>
            )}
          </Swiper>

          <FullScreenImage
            imageUrl={fullScreenImage}
            onClose={() => setFullScreenImage(null)} // Close the full-screen image view
          />

          {/* Add your square boxes for images here. You might need another package or custom UI for this. */}
        </View>

        <View style={styles.propertyDetailsTop}>
          <View style={styles.propertyDetailsTopLeft}>
            <Text style={styles.forSaleText}>For Sales</Text>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(propertyListing.approvalStatus, propertyListing.propertyStatus) }]}>
              <Text style={[styles.statusText, { color: getStatusTextColor(propertyListing.approvalStatus, propertyListing.propertyStatus) }]}>{getStatusText(propertyListing.approvalStatus, propertyListing.propertyStatus)}</Text>
            </View>
            <Text style={styles.title}>{propertyListing.title}</Text>
            <Text style={styles.priceLabel}>
              {propertyListing.offeredPrice ? (
                <>
                  ${formatPriceWithCommas(propertyListing.offeredPrice)}
                </>
              ) : (
                <>
                  ${formatPriceWithCommas(propertyListing.price)}
                </>
              )}
            </Text>
            <Text style={styles.pricePerSqm}>
              ${formatPricePerSqm(propertyListing.price, propertyListing.size)} psm{' '}
            </Text>
            <Text style={styles.roomsAndSize}>
              {propertyListing.bed} <Ionicons name="bed" size={16} color="#333" />  |
              {'  '}{propertyListing.bathroom} <Ionicons name="water" size={16} color="#333" />  |
              {'  '}{propertyListing.size} sqm  <Ionicons name="cube-outline" size={16} color="#333" /> {/* Added cube icon */}
            </Text>
          </View>

          <View style={styles.propertyDetailsTopRight}>
            <View style={styles.favoriteButtonContainer}>
              <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoriteButtonPress}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={30} color={isFavorite ? 'red' : '#333'} />
              </TouchableOpacity>
              <Text style={{ color: isFavorite ? 'red' : '#333', marginRight: 6, marginTop: -12, fontSize: 16, fontWeight: 'bold' }}>{favoriteCount}</Text>
            </View>
            {userDetails && (
              <View style={styles.userInfoContainer}>
                <TouchableOpacity
                  onPress={() => {
                    if (userDetails) {
                      navigation.navigate('View Profile', { userId: userDetails.userId, property: propertyListing }); // Pass the userId parameter
                    }
                  }}
                >
                  {profileImageBase64 ? (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${profileImageBase64}` }}
                      style={styles.userProfileImage}
                    />
                  ) : (
                    <Image
                      source={require('../../assets/Default-Profile-Picture-Icon.png')}
                      style={styles.userProfileImage}
                    />
                  )}
                </TouchableOpacity>
                {/* <Text style={styles.userName}>{userDetails?.name}</Text> */}
              </View>
            )}
          </View>
        </View>
        <View style={styles.dateContainer}>
          <FontAwesome name="building-o" size={18} color="#333" />
          <Text style={styles.flatText}>{"Flat Type: "}{capitalizeWords(propertyListing.flatType.toLowerCase().replace(/_/g, ' '))}</Text>
        </View>
        <View style={styles.dateContainer}>
          <FontAwesome name="calendar" size={16} color="#333" />
          <Text style={styles.dateText}>{formatDate(propertyListing.createdAt)}</Text>
        </View>
        <Text style={styles.dateContainer}>
          <Ionicons name="time-outline" size={17} color="#333" />
          {" "}
          <Text style={styles.dateText}>{"Lease Commence Year: "}{propertyListing.lease_commence_date}</Text>
        </Text>

        <View style={styles.userInfoContainer}></View>
        <Text style={styles.locationTitle}>Asking For {" "} <FontAwesome name="money" size={24} color="#333" /> </Text>
        <Text style={styles.dateContainer}>
          <Text style={styles.flatText}>{"1. Option Fee: "}</Text>
          <Text style={styles.description}>${formatPriceWithCommas(propertyListing.optionFee)}</Text>
        </Text>
        <Text style={styles.dateContainer}>
          <Text style={styles.flatText}>{"2. Option Exercise Fee: "}</Text>
          <Text style={styles.description}>${formatPriceWithCommas(propertyListing.optionExerciseFee)}</Text>
        </Text>
        <Text></Text>            

        <Text style={styles.descriptionHeader}>Description:</Text>
        <Text style={styles.description}>{propertyListing.description}</Text>
        <PredictionPriceCard
          flatType = {propertyListing.flatType} 
          town = {propertyListing.area}
          floorArea = {propertyListing.size} 
          // leaseCommenceDate = {propertyListing.lease_commence_date}
          leaseCommenceDate = {propertyListing.lease_commence_date}
          property={propertyListing}
        />
        {
          approvalStatus === 'APPROVED' ? (
            <>
              <Text style={styles.description}></Text>
            </>
          ) : (
            <>
              <Text style={styles.descriptionHeader}>
                <Ionicons name="clipboard-outline" size={20} color="#333" />
                {" "}Admin Notes For Rejection:</Text>
              <Text style={styles.descriptionAdminNotes}>{propertyListing.adminNotes}</Text>
            </>
          )}
        {/* Location Details */}
        <Text style={styles.locationTitle}>Location</Text>
        <View style={styles.locationDetailsContainer}>
          <View style={styles.locationDetailsRow}>
            <Text style={styles.roomsAndSize}>

              <Text style={styles.locationDetailsText}>{propertyListing.area}</Text>
              <MaterialCommunityIcons name="map-marker" size={18} color="#333" /> |
              {'  '}<Text style={styles.locationDetailsText}>{propertyListing.region}</Text>
              {' '}<MaterialCommunityIcons name="map" size={18} color="#333" />
            </Text>
          </View>
        </View>
        <View style={styles.mapContainer}>
          <MapView style={styles.map} region={region}>
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
              <Callout>
                <View style={styles.infoWindowContainer}>
                  <Text style={styles.infoWindowTitle}>Address:</Text>
                  <Text style={styles.infoWindowText}>{propertyListing.address}</Text>
                </View>
              </Callout>
            </Marker>
          </MapView>
        </View>

        {/* <View style={styles.zoomButtonContainer}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              // Zoom in by decreasing the latitudeDelta and longitudeDelta
              const zoomInRegion = {
                ...region,
                latitudeDelta: region.latitudeDelta / 2,
                longitudeDelta: region.longitudeDelta / 2,
              };
              setRegion(zoomInRegion);
              console.log("This is the line: ", userDetails)
            }}
          >
            <Ionicons name="add-circle" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              // Zoom out by increasing the latitudeDelta and longitudeDelta
              const zoomOutRegion = {
                ...region,
                latitudeDelta: region.latitudeDelta * 2,
                longitudeDelta: region.longitudeDelta * 2,
              };
              setRegion(zoomOutRegion);
            }}
          >
            <Ionicons name="remove-circle" size={24} color="white" />
          </TouchableOpacity>
        </View> */}

      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomButtonsContainer}>
        {isCurrentUserPropertyOwner ? (
          <>
            <TouchableOpacity style={styles.calendarButton} onPress={() => {
              navigation.navigate('Set Schedule', { propertyListingId });
            }}
            >
              <Ionicons name="calendar-outline" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bumpListingButton} onPress={() => {
              navigation.navigate('Boost Listing', { propertyListingId });
            }}
            >
              <Text style={styles.buttonText}>Bump Listing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editListingButton} onPress={() => {
              navigation.navigate('Edit Property User Listing', { propertyListingId });
            }}
            >
              <Text style={styles.buttonText}>Edit Listing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteListingButton} onPress={handleDeleteListing}>
              <Text style={styles.buttonText}>Delete Listing</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.chatWithSellerButton} >
              <Text style={styles.buttonTextUser}>Chat With Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewScheduleButton} onPress={() => {
              navigation.navigate('Schedule', { propertyListingId, userDetails });
            }}>
              <Text style={styles.buttonTextUser}>View Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buyButton, propertyListing.propertyStatus === "ON_HOLD" || propertyListing.propertyStatus === "COMPLETED" ? { backgroundColor: "#ccc" } : null]} 
            onPress={() => {
              navigation.navigate('Purchase Option Fee Info', { propertyListing, isOfferedPrice: false });
            }}
              disabled={propertyListing.propertyStatus === "ON_HOLD" || propertyListing.propertyStatus === "COMPLETED"}
            >
              <Text style={styles.buttonTextUser}>Buy</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGallery: {
    height: 300,
  },
  wrapper: {},
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover', // Use 'cover' for better image fitting
  },
  propertyDetails: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  descriptionAdminNotes: {
    paddingLeft: 16,
    marginBottom: 20,
    color: 'red',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: 300,
  },
  mapContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  zoomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    paddingBottom: 16,
  },
  zoomButton: {
    backgroundColor: 'grey',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  infoWindowContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
  },
  infoWindowTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 10,
    marginBottom: 4,
  },
  infoWindowText: {
    fontSize: 12,
    width: '90%',
    marginHorizontal: 10,
    marginBottom: 2,
  },
  userProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignContent: 'center',
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingLeft: 16, // Add left padding for better alignment
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingLeft: 16,
    marginBottom: 10,
  },
  description: {
    paddingLeft: 16,
    marginBottom: 20,
  },
  // Styles for fixed bottom buttons
  bottomButtonsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    justifyContent: 'space-between', // Added for spacing between buttons
    paddingHorizontal: 10, // Padding to give space from the screen edge
    paddingBottom: 20, // Add margin to give space from the bottom of the screen
  },

  chatWithSellerButton: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white', // Choose your color
    alignItems: 'center',
    borderWidth: 1,       // Add border
    borderColor: '#000',  // Border color
    borderRadius: 10,     // Make it rounded
    margin: 2,  // Margin for spacing between buttons
  },

  viewScheduleButton: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white', // Choose your color
    alignItems: 'center',
    borderWidth: 1,       // Add border
    borderColor: '#000',  // Border color
    borderRadius: 10,     // Make it rounded
    margin: 2,  // Margin for spacing between buttons
  },

  buyButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFD700', // Yellow color
    alignItems: 'center',
    borderWidth: 1,        // Add border
    borderColor: '#000',   // Border color
    borderRadius: 10,      // Make it rounded
    margin: 2,  // Margin for spacing between buttons
  },

  buttonText: {
    fontSize: 12,
    color: '#000',           // Black text color for all buttons
  },
  buttonTextUser: {
    fontSize: 12,
    color: '#000',           // Black text color for all buttons
    marginTop: 4,         // Remove bottom margin for all buttons
  },

  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
  },

  // For the top property details
  propertyDetailsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },

  propertyDetailsTopLeft: {
    flex: 3,
  },
  propertyDetailsTopRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  forSaleText: {
    fontSize: 20,
    color: '#333',
    letterSpacing: 2,
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 2,
  },
  favoriteButton: {
    marginRight: 10,
    paddingBottom: 10,
  },
  locationDetails: {
    paddingLeft: 16,
    marginBottom: 20,
  },
  favoriteButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bumpListingButton: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white', // Choose your color
    alignItems: 'center',
    borderWidth: 1,       // Add border
    borderColor: '#000',  // Border color
    borderRadius: 10,     // Make it rounded
    margin: 2,  // Margin for spacing between buttons
  },

  editListingButton: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white', // Choose your color
    alignItems: 'center',
    borderWidth: 1,       // Add border
    borderColor: '#000',  // Border color
    borderRadius: 10,     // Make it rounded
    margin: 2,  // Margin for spacing between buttons
  },

  deleteListingButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFD700', // Yellow color
    alignItems: 'center',
    borderWidth: 1,        // Add border
    borderColor: '#000',   // Border color
    borderRadius: 10,      // Make it rounded
    margin: 2,  // Margin for spacing between buttons
  },
  title: {
    fontSize: 18,
    color: '#333',
    letterSpacing: 2,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  imageGalleryContainer: {
    position: 'relative',
    height: 300,
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16, // Adjust the top position as needed
    left: 16, // Adjust the left position as needed
    zIndex: 1, // Place it above the swiper
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    marginBottom: 10,
    marginTop: -5
  },
  dateText: {
    fontSize: 13,
    marginLeft: 5,
    color: '#333',
  },
  locationDetailsContainer: {
    paddingLeft: 16,
    marginBottom: 20,
  },
  locationDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDetailsText: {
    fontSize: 13,
    marginLeft: 8,
    color: '#333',
  },
  calendarButton: {
    padding: 4,
    backgroundColor: 'white', // Choose your color
    alignItems: 'center',
    borderWidth: 1,       // Add border
    borderColor: '#000',  // Border color
    borderRadius: 10,     // Make it rounded
    margin: 2,  // Margin for spacing between buttons
  },
  statusIndicator: {
    position: 'absolute',
    top: -8,
    right: -95,
    borderWidth: 0.18,
    paddingVertical: 0,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: 'yellow', // Default color
  },
  statusText: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: 'bold',
    color: '#000',
    padding: 2,
  },
  flatText: {
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 5,
    color: '#333',
  },
});

export default PropertyUserListingScreen;
