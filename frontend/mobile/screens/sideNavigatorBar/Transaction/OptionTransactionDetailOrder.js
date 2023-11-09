import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomerCard from './CardComponents/CustomerCard';
import PropertyCardRectangle from './CardComponents/PropertyCardRectangle';
import TrackOrderCard from './CardComponents/TrackOrderCard';
import {
    getPropertyListing, getUserById
} from '../../../utils/api';
import {
    getTransactionByTransactionId
} from '../../../utils/transactionApi';
import StepIndicator from 'react-native-step-indicator';
import { useFocusEffect } from '@react-navigation/native';
import {
    buyerCancelOTP, buyerRequestReupload
} from '../../../utils/transactionApi';

const OrderDetailScreen = ({ route }) => {
    const navigation = useNavigation();
    const [propertyListing, setPropertyListing] = useState(null);
    const [transaction, setTransaction] = useState(null);
    const [seller, setSeller] = useState(null);
    const { transactionId } = route.params;
    const [refreshKey, setRefreshKey] = useState(0);

    useFocusEffect(
        React.useCallback(() => {
            console.log('page gained focus');
            fetchTransaction(transactionId);
        }, [])
    );

    useEffect(() => {
        fetchTransaction(transactionId);
    }, [refreshKey, transactionId]);

    const fetchTransaction = async (id) => {
        try {
            const { success, data, message } = await getTransactionByTransactionId(id);
            console.log("data: ", data.transactions[0])
            setTransaction(data.transactions[0]); // Update state with the fetched data
            fetchPropertyListing(data.transactions[0].propertyId);
            fetchUser(data.transactions[0].userId);
        } catch (error) {
            console.error('Error fetching transaction:', error);
        }
    };

    const fetchPropertyListing = async (id) => {
        try {
            const response = await fetch(getPropertyListing(id));
            const data = await response.json();
            setPropertyListing(data); // Update state with the fetched data
            console.log('Property Listing Data:', data)
        } catch (error) {
            console.error('Error fetching property listing:', error);
        }
    };

    const fetchUser = async (userId) => {
        try {
            console.log("userId: ", userId)
            const { success, data, message } = await getUserById(userId);

            if (success) {
                setSeller(data);
                return data;
            } else {
                // Handle the error here
                console.error('Error fetching user:', message);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const handleCancelOrder = () => {
        Alert.alert(
            'Confirm Cancellation',
            'Are you sure you want to place a cancellation for this property?',
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                { text: 'Confirm', onPress: cancelOrder },
            ],
            { cancelable: false }
        );
    }

    const cancelOrder = async () => {
        await buyerCancelOTP(transaction.transactionId, {
            optionToPurchaseDocumentId: transaction.optionToPurchaseDocumentId,
        });
        Alert.alert(
            'Cancel Successful',
            'You have successfully cancelled the order.'
        );
        setRefreshKey(prevKey => prevKey + 1);
        // navigation.navigate('Option Transaction Order Screen', { transactionId: transaction.transactionId});
    }

    const handleRequestReupload = () => {
        Alert.alert(
            'Confirm Cancellation',
            'Are you sure you want to request for a reupload for the OTP Document?',
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                { text: 'Confirm', onPress: requestReupload },
            ],
            { cancelable: false }
        );
    }

    const requestReupload = async () => {
        await buyerRequestReupload(transaction.transactionId, {
            optionToPurchaseDocumentId: transaction.optionToPurchaseDocumentId,
        });
        Alert.alert(
            'Request Successful',
            'You have successfully request for a reupload.'
        );
        setRefreshKey(prevKey => prevKey + 1);
        // navigation.navigate('Option Transaction Order Screen', { transactionId: transaction.transactionId});
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.header}>Detail Order</Text>
            </View>

            {propertyListing && seller ? (
                <>
                    <CustomerCard sellerId={transaction.userId} />

                    <PropertyCardRectangle
                        property={propertyListing}
                        transaction={transaction}
                        seller={seller}
                        onPress={() => {
                            navigation.navigate('Property Listing', { propertyListingId: propertyListing.propertyListingId })
                        }}
                    />

                    <TrackOrderCard
                        key={refreshKey}
                        optionFeeStatus={transaction.optionFeeStatusEnum}
                        paymentAmount={transaction.paymentAmount}
                        onHoldBalance={transaction.onHoldBalance}
                        transactionId={transaction.transactionId}
                        transactionDate={transaction.createdAt}
                        transactionUserId={transaction.userId}
                    />
                </>
            ) : (
                <Text>Loading...</Text>
            )}

            <View style={styles.bottomButtonsContainer}>
                {transaction && transaction.optionFeeStatusEnum == "SELLER_UPLOADED" ? (
                    <TouchableOpacity style={styles.uploadButton}
                        onPress={() => {
                            navigation.navigate('Buyer Upload OTP', { property: propertyListing, transaction: transaction });
                        }}>
                        <Text style={styles.cancelButtonText}>Upload OTP</Text>
                    </TouchableOpacity>
                ) : (
                    <></>
                )}

                {transaction && transaction.optionFeeStatusEnum == "SELLER_UPLOADED" ? (
                    <TouchableOpacity style={styles.requestReuploadButton} onPress={handleRequestReupload}>
                        <Text style={styles.cancelButtonText}>Request Reupload</Text>
                    </TouchableOpacity>
                ) : (
                    <></>
                )}
            </View>

            {transaction && (transaction.optionFeeStatusEnum == "REQUEST_PLACED" || transaction.optionFeeStatusEnum == "SELLER_UPLOADED" || transaction.optionFeeStatusEnum == "BUYER_REQUEST_REUPLOAD") ? (
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                    <Text style={styles.cancelButtonText}>Cancel Order</Text>
                </TouchableOpacity>
            ) : (
                <></>
            )}

            {transaction && transaction.optionFeeStatusEnum == "ADMIN_SIGNED" ? (
                <TouchableOpacity style={styles.uploadButton}
                    onPress={() => {
                        navigation.navigate('Exercise Option Checkout', { propertyListing, quantity: 1, transaction: transaction });
                    }}>
                    <Text style={styles.cancelButtonText}>Exercise Option</Text>
                </TouchableOpacity>
            ) : (
                <></>
            )}

            {transaction && transaction.optionFeeStatusEnum == "PENDING_COMMISSION" ? (
                <TouchableOpacity style={styles.uploadButton}
                    onPress={() => {
                        navigation.navigate('Commission Checkout', { propertyListing, quantity: 1, transaction: transaction });
                    }}>
                    <Text style={styles.cancelButtonText}>Pay Commission</Text>
                </TouchableOpacity>
            ) : (
                <></>
            )}

            <Text></Text>
            <Text></Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,

    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 120,
        marginTop: 40,
        paddingBottom: 20,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    profileContainer: {
        alignItems: 'center',
        padding: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
    },
    chatButton: {
        backgroundColor: '#1565c0',
        padding: 10,
        borderRadius: 20,
        marginTop: 10,
    },
    chatButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    orderInfo: {
        padding: 20,
    },
    productTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    productPrice: {
        fontSize: 16,
        color: '#d32f2f',
        fontWeight: 'bold',
        marginTop: 5,
    },
    units: {
        fontSize: 14,
        marginTop: 5,
    },
    orderTracking: {
        padding: 20,
        height: 400,
    },
    orderStatus: {
        fontSize: 14,
        marginTop: 5,
    },
    cancelButton: {
        backgroundColor: '#d32f2f',
        padding: 15,
        borderRadius: 10,
        margin: 20,
    },
    cancelButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    uploadButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        margin: 10,
        marginBottom: 1,
    },
    requestReuploadButton: {
        flex: 2,
        backgroundColor: 'orange',
        padding: 15,
        borderRadius: 10,
        margin: 10,
        marginBottom: 1,
    },
    bottomButtonsContainer: {
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderTopColor: '#eee',
        justifyContent: 'space-between', // Added for spacing between buttons
        paddingHorizontal: 11, // Padding to give space from the screen edge
    },
});

export default OrderDetailScreen;
