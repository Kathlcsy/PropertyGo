import React, {useContext, useEffect, useState} from 'react';
import {
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator, Button
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {AuthContext} from "../../AuthContext";
import {fetchPartnerByRangeAndType} from "../../utils/partnerApi";
import {useFocusEffect} from "@react-navigation/native";
import {SceneMap, TabBar, TabView} from "react-native-tab-view";
import {dateFormatter, convertImage} from "../../services/commonFunctions";
import {RatingComponent} from "../../components/RatingStars";
import {LoadingIndicator} from "../../components/LoadingIndicator";
import {ImageSwiper} from "../../components/ImageSwiper";
import { CheckBox } from 'react-native-elements';


const cardSize = Dimensions.get('window').width;

// Editing the explore services to show the different partner.
const ExploreServices = ({navigation, route}) => {
    const {user} = useContext(AuthContext);
    const USER_ID = user.user.userId
    const [lawyers, setLawyers] = useState([])
    const [contractor, setContractor] = useState([])
    const [start, setStart] = useState(1)
    const [end, setEnd] = useState(5)
    const [selectedLawyer, setSelectedLawyer] = useState(null)
    const [selectedContractor, setSelectedContractor] = useState(null)
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'lawyer', title: 'Lawyer' },
        { key: 'contractor', title: 'Contractor' },
    ]);
    const USER_TYPE = ["LAWYER", "CONTRACTOR"]
    const [modalVisible, setModalVisible] = useState(false)


    useFocusEffect(
        React.useCallback(() => {
            console.log('Explore Services gained focus');
            fetchLawyers().then(r => console.log("Fetched lawyer."));
            fetchContractors().then(r => console.log("Fetch contractor."));
        }, [])
    );

    useEffect(() => {
        fetchLawyers().then(r => console.log("Fetched lawyer."));
        fetchContractors().then(r => console.log("Fetch contractor."));
        console.log("Data fetched.")
    }, []);

    const fetchLawyers = async() => {
        try {
            const lawyers = await fetchPartnerByRangeAndType(USER_TYPE[0], start, end)
            setLawyers(lawyers.partnerInfo)
            console.log("Found lawyers: ", lawyers)
        } catch (error) {
            console.error("Error fetching lawyers: ", error)
        }
    }

    const fetchContractors = async() => {
        try {
            const contractor = await fetchPartnerByRangeAndType(USER_TYPE[1], start, end)
            setContractor(contractor.partnerInfo)
            console.log("Found contractors: ", contractor)
        } catch (error) {
            console.error("Error fetching contractor: ", error)
        }
    }


    const LawyerRoute = () => {
        const [searchQuery, setSearchQuery] = useState('');
        const [filterBy, setFilterBy] = useState('name');

        const filteredLawyers = lawyers.filter(lawyer => {
            switch(filterBy) {
                case 'name':
                    return lawyer.name.toLowerCase().includes(searchQuery.toLowerCase());
                case 'companyName':
                    return lawyer.companyName.toLowerCase().includes(searchQuery.toLowerCase());
                case 'date':
                    return new Date(lawyer.createdAt).toISOString().split('T')[0] === searchQuery;
                default:
                    return true;
            }
        });

        return (
            <ScrollView>
                <View>
                    <View style={{ flexDirection: "row", alignSelf:"center", alignContent:"flex-start", marginTop: 5}}>
                        <CheckBox
                            title='Name'
                            checkedIcon='dot-circle-o'
                            uncheckedIcon='circle-o'
                            checked={filterBy === 'name'}
                            onPress={() => setFilterBy('name')}
                            containerStyle={styles.checkBox}
                        />
                        <CheckBox
                            title='Company'
                            checkedIcon='dot-circle-o'
                            uncheckedIcon='circle-o'
                            checked={filterBy === 'companyName'}
                            onPress={() => setFilterBy('companyName')}
                            containerStyle={styles.checkBox}
                        />
                        <CheckBox
                            title='Date'
                            checkedIcon='dot-circle-o'
                            uncheckedIcon='circle-o'
                            checked={filterBy === 'date'}
                            onPress={() => setFilterBy('date')}
                            containerStyle={styles.checkBox}
                        />
                    </View>
                </View>
                <View style={{padding: 10, marginLeft: 10, flexDirection: "row", alignItems: "center"}}>
                    <Icon name="search" size={20} color="#000" style={styles.searchIcon} />
                    <TextInput
                        style={{height: 40, borderColor: 'gray', borderWidth: 1, paddingLeft: 8, width: cardSize*0.8}}
                        placeholder="Search for a lawyer..."
                        value={searchQuery}
                        onChangeText={text => setSearchQuery(text)}
                    />
                </View>
                <View style={[styles.scene, {backgroundColor: '#f3f3f3'}]}>
                    {filteredLawyers.length !== 0 ? filteredLawyers.map((item) => (
                        <TouchableOpacity
                            style={[styles.card, {width: cardSize * 0.92, height: cardSize * 0.28}]}
                            onPress={() => {
                                setSelectedLawyer(item);
                                setModalVisible(!modalVisible);
                                setSearchQuery(searchQuery)
                            }}
                        >
                            <View style={styles.profileHeader}>
                                {item.profileImage !== null ? (
                                    <Image
                                        source={{uri: `data:image/jpeg;base64,${convertImage(item.profileImage.data)}`}}
                                        style={styles.profileImage}
                                    />
                                ) : (
                                    <Image
                                        source={require('../../assets/Default-Profile-Picture-Icon.png')} // Provide a default image source
                                        style={{width: 50, height: 50, borderRadius: 120}}
                                    />
                                )}
                            </View>
                            <View style={styles.propertyDetails}>
                                <Text style={styles.propertyTitle}>{item.name}</Text>
                                <Text style={styles.propertyPrice}>Ratings: <RatingComponent rating={item.rating}/>
                                </Text>
                                <Text style={styles.propertyPrice}>Experience: {item.experience}</Text>
                                <Text style={styles.propertyPrice}>E-Mail: {item.email}</Text>
                                <Text style={styles.propertyDetails}>{dateFormatter(item.createdAt)}</Text>
                            </View>
                        </TouchableOpacity>
                    )) : <LoadingIndicator/>}
                </View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(!modalVisible);
                    }}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            {/* Render more details about the selectedTransaction */}
                            <Text style={styles.propertyTitle}>{selectedLawyer?.name}</Text>
                            <Text style={styles.propertyTitle}>{selectedLawyer?.companyName}</Text>
                            <Text style={styles.propertyPrice}><RatingComponent rating={selectedLawyer?.rating}/></Text>
                            <Image
                                source={require('../../assets/Default-Profile-Picture-Icon.png')} // Provide a default image source
                                style={{width: 50, height: 50, borderRadius: 120}}
                            />
                            <Text style={styles.propertyPrice}>{selectedLawyer?.userName}</Text>
                            <Text style={styles.propertyDetails}>Project
                                Completed: {selectedLawyer?.projectsCompleted}</Text>
                            <Text style={styles.propertyDetails}>{dateFormatter(selectedLawyer?.createdAt)}</Text>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => navigation.navigate("Chats")}
                            >
                                <Text style={styles.textStyle}>Chat With Lawyer</Text>
                            </TouchableOpacity>
                            <Text>&nbsp;</Text>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setModalVisible(!modalVisible)}
                            >
                                <Text style={styles.textStyle}>Hide</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        );
    }

    const ContractorRoute = () => {
        const [searchQuery, setSearchQuery] = useState('');
        const [filterBy, setFilterBy] = useState('name');

        const filteredContractors = contractor.filter(lawyer => {
            switch(filterBy) {
                case 'name':
                    return lawyer.name.toLowerCase().includes(searchQuery.toLowerCase());
                case 'companyName':
                    return lawyer.companyName.toLowerCase().includes(searchQuery.toLowerCase());
                case 'date':
                    return new Date(lawyer.createdAt).toISOString().split('T')[0] === searchQuery;
                default:
                    return true;
            }
        });
        return (
            <ScrollView>
                <View style={[styles.scene, {backgroundColor: '#f3f3f3'}]}>
                    <View>
                        <View style={{ flexDirection: "row", alignSelf:"center", alignContent:"flex-start", marginTop: 5}}>
                            <CheckBox
                                title='Name'
                                checkedIcon='dot-circle-o'
                                uncheckedIcon='circle-o'
                                checked={filterBy === 'name'}
                                onPress={() => setFilterBy('name')}
                                containerStyle={styles.checkBox}
                            />
                            <CheckBox
                                title='Company'
                                checkedIcon='dot-circle-o'
                                uncheckedIcon='circle-o'
                                checked={filterBy === 'companyName'}
                                onPress={() => setFilterBy('companyName')}
                                containerStyle={styles.checkBox}
                            />
                            <CheckBox
                                title='Date'
                                checkedIcon='dot-circle-o'
                                uncheckedIcon='circle-o'
                                checked={filterBy === 'date'}
                                onPress={() => setFilterBy('date')}
                                containerStyle={styles.checkBox}
                            />
                        </View>
                    </View>
                    <View style={{padding: 10, flexDirection: "row", alignItems: "center"}}>
                        <Icon name="search" size={20} color="#000" style={styles.searchIcon} />
                        <TextInput
                            style={{height: 40, borderColor: 'gray', borderWidth: 1, paddingLeft: 8, width: cardSize*0.8}}
                            placeholder="Search for a contractor..."
                            value={searchQuery}
                            onChangeText={text => setSearchQuery(text)}
                        />
                    </View>
                    {filteredContractors.length !== 0 ? filteredContractors.map((item) => (
                        <TouchableOpacity
                            style={[styles.card, {width: cardSize * 0.92, height: cardSize * 0.28}]}
                            onPress={() => {
                                setSelectedContractor(item);
                                setModalVisible(!modalVisible);
                            }}
                        >
                            <View style={styles.profileHeader}>
                                {item.profileImage !== null ? (
                                    <Image
                                        source={{uri: `data:image/jpeg;base64,${convertImage(item.profileImage.data)}`}}
                                        style={styles.profileImage}
                                    />
                                ) : (
                                    <Image
                                        source={require('../../assets/Default-Profile-Picture-Icon.png')} // Provide a default image source
                                        style={{width: 50, height: 50, borderRadius: 120}}
                                    />
                                )}
                            </View>
                            <View style={styles.propertyDetails}>
                                <Text style={styles.propertyTitle}>{item.name}</Text>
                                <Text style={styles.propertyPrice}>Ratings: <RatingComponent
                                    rating={item.rating}/></Text>
                                <Text style={styles.propertyPrice}>Experience: {item.experience}</Text>
                                <Text style={styles.propertyPrice}>E-Mail: {item.email}</Text>
                                <Text style={styles.propertyDetails}>{dateFormatter(item.createdAt)}</Text>
                            </View>
                        </TouchableOpacity>
                    )) : <LoadingIndicator/>}
                </View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(!modalVisible);
                    }}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            {/* Render more details about the selectedTransaction */}
                            <Text style={styles.propertyTitle}>{selectedContractor?.name}</Text>
                            <Text style={styles.propertyTitle}>{selectedContractor?.companyName}</Text>
                            <Text style={styles.propertyPrice}><RatingComponent
                                rating={selectedContractor?.rating}/></Text>
                            <Image
                                source={require('../../assets/Default-Profile-Picture-Icon.png')} // Provide a default image source
                                style={{width: 50, height: 50, borderRadius: 120}}
                            />
                            <Text style={styles.propertyPrice}>{selectedContractor?.userName}</Text>
                            <Text style={styles.propertyDetails}>Project
                                Completed: {selectedContractor?.projectsCompleted}</Text>
                            <Text style={styles.propertyDetails}>{dateFormatter(selectedContractor?.createdAt)}</Text>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.textStyle}>Chat With Contractor</Text>
                            </TouchableOpacity>
                            <Text>&nbsp;</Text>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setModalVisible(!modalVisible)}
                            >
                                <Text style={styles.textStyle}>Hide</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        );
    }


    return (
        <View style={{flex: 1}}>
            <ImageSwiper></ImageSwiper>
            <TabView
                navigationState={{ index, routes }}
                renderScene={SceneMap({
                    lawyer: LawyerRoute,
                    contractor: ContractorRoute,
                })}
                onIndexChange={setIndex}
                initialLayout={{ height: 30 }}
                renderTabBar={props => (
                    <TabBar
                        {...props}
                        indicatorStyle={{ backgroundColor: 'white' }}
                        style={{ backgroundColor: '#888' }}
                    />
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    scene: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    card: {
        backgroundColor: '#fff',
        alignSelf: 'center', // Center the card
        justifyContent: 'center',
        alignItems: "center",
        flexDirection: "row",
        marginVertical: 5, // A little margin top and bottom for spacing between cards
        paddingTop: 10,
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

    profileHeader: {
        paddingHorizontal: 10,
    },

    propertyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    propertyListing: {
        flexDirection: 'row',
        marginBottom: 10,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    propertyImage: {
        width: 100,
        height: 100,
        marginRight: 10,
    },
    propertyDetails: {
        fontStyle: "italic",
    },
    propertyDescription: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    propertyPrice: {
        fontSize: 14,
        color: '#888',
    },
    searchIcon: {
        marginRight: 10, // Adjust the margin as needed
        color: "#ccc",
    },
    propertyArea: {
        fontSize: 14,
        color: '#888',
    },
    propertyRoomFeatures: {
        fontSize: 14,
        color: '#888',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleIcon: {
        marginRight: 10, // Add right margin for the icon
    },
    swiperImage: {
        width: '100%',
        height: '100%', // Adjust the height as needed
    },
    swiperContainer: {
        height: 130, // Set the desired height
        marginLeft: 15, // Add left padding
        marginRight: 15, // Add right padding
        alignSelf: 'center', // Center horizontally
    },
    suggestionsContainer: {
        width: '80%', // Take up 80% width
        backgroundColor: 'white',
        borderRadius: 10,
        marginTop: 5,
        marginBottom: 10,
        alignSelf: 'center',
        elevation: 5, // Add elevation for shadow effect (Android)
        shadowColor: 'rgba(0, 0, 0, 0.2)', // Add shadow (iOS)
        shadowOffset: {width: 0, height: 2}, // Add shadow (iOS)
        shadowOpacity: 0.8, // Add shadow (iOS)
        shadowRadius: 2, // Add shadow (iOS)
    },
    checkBox: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        margin: 0,
        width: cardSize * 0.25 // adjust this value as needed
    },
    suggestionBorder: {
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        backgroundColor: 'white', // Match background color
        height: 10,
    },
    suggestionItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    suggestionItemLast: {
        borderBottomWidth: 0, // Remove border for the last item
    },
    suggestionText: {
        fontSize: 14, // Make text smaller
    },
    suggestionsOverlay: {
        position: 'absolute',
        top: 50, // Adjust the top position as needed
        left: 8,
        right: 0,
        zIndex: 1,
        width: '95%', // Take up 80% width
        backgroundColor: 'white',
        borderRadius: 10,
        marginTop: 5,
        marginBottom: 10,
        alignSelf: 'center',
        elevation: 5, // Add elevation for shadow effect (Android)
        shadowColor: 'rgba(0, 0, 0, 0.2)', // Add shadow (iOS)
        shadowOffset: {width: 0, height: 2}, // Add shadow (iOS)
        shadowOpacity: 0.8, // Add shadow (iOS)
        shadowRadius: 2, // Add shadow (iOS)
    },
    noResultsContainer: {
        alignItems: 'center',
        position: 'absolute',
        top: 50, // Adjust the top position as needed
        left: 8,
        right: 0,
        zIndex: 1,
        width: '95%', // Take up 80% width
        backgroundColor: 'white',
        borderRadius: 10,
        marginTop: 5,
        marginBottom: 10,
        alignSelf: 'center',
        elevation: 5, // Add elevation for shadow effect (Android)
        shadowColor: 'rgba(0, 0, 0, 0.2)', // Add shadow (iOS)
        shadowOffset: {width: 0, height: 2}, // Add shadow (iOS)
        shadowOpacity: 0.8, // Add shadow (iOS)
        shadowRadius: 2, // Add shadow (iOS)
    },
    noResultsText: {
        marginTop: 10,
        marginBottom: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2
    },
    buttonClose: {
        backgroundColor: "#2196F3",
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    }

});

export default ExploreServices;

