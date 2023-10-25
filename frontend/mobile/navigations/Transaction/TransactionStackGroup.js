import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ViewAppointmentDetail from "../../screens/sideNavigatorBar/Appointment/ViewAppointmentDetail";
import TransactionMainTabNavigator from './TransactionMainTabNavigator';
import PropertyUserListing from "../../screens/propertyListings/PropertyUserListing";
import EditPropertyListing from "../../screens/propertyListings/EditPropertyListing";
import SetSchedule from "../../screens/schedule/SetSchedule";
import ViewUserProfile from "../../screens/userProfile/ViewUserProfile";
import Schedule from "../../screens/schedule/SetSchedule";
import Map from "../../screens/propertyListings/map";

import TransactionList from "../../screens/dashboard/transactionList"

const TransactionStack = createNativeStackNavigator();

const TransactionStackGroup = () => {

    return (
        <TransactionStack.Navigator screenOptions={{headerShown: false}}>
            {/* <AppointmentStack.Screen name={"Appointment Main"} component={AppointmentMain}/> */}
            <TransactionStack.Screen name={"Appointment Main"} component={TransactionMainTabNavigator}/>
        </TransactionStack.Navigator>
    );
};
export default TransactionStackGroup;