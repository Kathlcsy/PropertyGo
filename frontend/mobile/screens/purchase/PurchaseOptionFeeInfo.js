import React, { useContext, useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native';
import { updateUserStripeCustomerId, initializePaymentSheet, createTransactionRecord, fetchUpdatedUserDetails, handleDeepLink } from '../../services/StripeServices';
import { AuthContext } from '../../AuthContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const PurchaseOptionFeeInfo = ({ route }) => {
    const { user } = useContext(AuthContext);
    const { propertyListing, isOfferedPrice } = route.params;
    const navigation = useNavigation();
    const description = "Purchase Option Fee";

    const handleSubmit = () => {
        Alert.alert(
            'Confirm Request',
            'Are you sure you want to place a request for this property?',
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                { text: 'Confirm', onPress: createTransaction },
            ],
            { cancelable: false }
        );
    }

    const createTransaction = async () => {
        const status = "PENDING"
        const transactionType = "OPTION_FEE"
        const gst = false;
        const paymentAmount = 0; //As payment is still processing

        const transaction = await createTransactionRecord(propertyListing, user.user, status, transactionType, description, 1, paymentAmount, gst);
        Alert.alert('Success', 'Your request is confirmed!');
        console.log("transaction: ", transaction);
        navigation.navigate('Option Transaction Order Screen', { transactionId: transaction.transactionId });
    }

    return (
        <ScrollView>
            <View style={styles.headerContainer}>
                {/* Back button */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.header}>Option Fee Process</Text>
            </View>

            <View style={styles.cardContainer}>
                <Text style={styles.headerDescription}><Text style={styles.bold}>Step 1:</Text> Payment of Option Fee via Stripe</Text>
                <Text style={styles.description}><Text style={styles.bold}>1.</Text> The buyer initiates the property purchasing process by making a payment for the Option Fee using the provided Stripe payment gateway. This fee is required to secure the property and hold it for the buyer's consideration.</Text>
                <Text style={styles.description}><Text style={styles.bold}>2.</Text> The paid amount is placed on hold for a period of 3 days. During this time, the seller is notified of the payment and given the opportunity to respond.</Text>
                <Text style={styles.description}><Text style={styles.bold}>3.</Text> If the seller does not respond within the specified time frame, the Option Fee is automatically refunded to the buyer.</Text>

                <Text style={styles.headerDescription}><Text style={styles.bold}>Step 2:</Text> Notification of Seller's Response</Text>
                <Text style={styles.description}><Text style={styles.bold}>1.</Text> Upon the seller's response, including uploading the Option To Purchase document, the buyer receives a notification informing them of the seller's action.</Text>
                <Text style={styles.description}><Text style={styles.bold}>2.</Text> The buyer reviews and signs the document as required.</Text>

                <Text style={styles.headerDescription}><Text style={styles.bold}>Step 3:</Text> Admin Signature</Text>
                <Text style={styles.description}><Text style={styles.bold}>1.</Text> After the buyer signs the document, it is forwarded to the admin for their signature as a witness to the transaction.</Text>

                <Text style={styles.headerDescription}><Text style={styles.bold}>Step 4:</Text> Setting the Option to Purchase Deadline</Text>
                <Text style={styles.description}><Text style={styles.bold}>1.</Text> The seller specifies an Option to Purchase deadline within the application. The buyer must sign the document before this deadline.</Text>

                <Text style={styles.headerDescription}><Text style={styles.bold}>Step 5:</Text> Exercising the Purchase</Text>
                <Text style={styles.description}><Text style={styles.bold}>1.</Text> If the buyer decides to proceed with the purchase, they pay the Option Exercise Fee as specified by the seller. If it's past the OTP Deadline, the property listing's status changes from 'ON HOLD' to 'ACTIVE,' making the property available for other potential buyers.</Text>
                <Text style={styles.description}><Text style={styles.bold}>2.</Text> Subsequently, the buyer and seller can continue the transaction process, including arranging the down payment and housing financing through the Platform's chat.</Text>

                <Text></Text>
            </View>

            {/* Button to proceed to checkout */}
            <TouchableOpacity style={styles.checkoutButton} onPress={handleSubmit}>
                <Text style={styles.checkoutButtonText}>
                    Proceed To Request
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 95,
        marginTop: 55,
    },
    headerTwo: {
        marginLeft: 25,
        marginRight: 25,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 30,
        marginTop: 10,
    },
    backButton: {
        position: 'absolute',
        top: 55,
        left: 16,
        zIndex: 1,
    },
    description: {
        fontSize: 13,
        marginRight: 20,
        marginLeft: 25,
        marginBottom: 16,
        letterSpacing: 0.4,
    },
    bold: {
        fontWeight: 'bold',
    },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        borderRadius: 25,
        padding: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        width: 300,
        alignSelf: 'center',
        marginBottom: 50,
    },
    checkoutButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    headerDescription: {
        fontSize: 13,
        fontWeight: 'bold',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    description: {
        fontSize: 13,
        marginRight: 20,
        marginLeft: 25,
        marginBottom: 16,
        letterSpacing: 0.4,
    },
    cardContainer: {
        backgroundColor: 'white', // Set the background color to white
        borderRadius: 10,
        margin: 16,
        padding: 2,
        elevation: 5, // Add elevation for shadow on Android
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        paddingTop: 25,
        marginBottom: 40,
      },
});

export default PurchaseOptionFeeInfo;
