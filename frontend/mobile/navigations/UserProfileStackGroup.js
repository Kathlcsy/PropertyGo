import React from 'react';
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import UserProfile from '../screens/sideNavigatorBar/UserProfile';
import EditProfile from '../screens/userProfile/EditProfile';
import UpdatePassword from '../screens/userProfile/UpdatePassword';
import UpdateBank from '../screens/userProfile/UpdateBank';

const UserProfileStack = createNativeStackNavigator();

const UserProfileStackGroup = () => {
    return (
        <UserProfileStack.Navigator screenOptions={{headerShown: false}}>
            {/* <UserProfileStack.Screen name="ProfileUpdate" component={ProfileUpdate} /> */}
            <UserProfileStack.Screen name="UserProfile" component={UserProfile}/>
            <UserProfileStack.Screen name="EditProfile" component={EditProfile}/>
            <UserProfileStack.Screen name="UpdatePassword" component={UpdatePassword}/>
            <UserProfileStack.Screen name="Update Bank Account" component={UpdateBank}/>
        </UserProfileStack.Navigator>
    );
};

export default UserProfileStackGroup;
