import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import Transaction from './src/screens/Transaction';
import Chart from './src/screens/Chart';
import CategoriesScreen from './src/screens/CategoriesScreen';
import Notification from './src/screens/Notification';
import AddNotification from './src/screens/AddNotification';
import EditNotification from './src/screens/EditNotification';
import Profile from './src/screens/Profile';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import SavingsGoalsScreen from './src/screens/SavingsGoalsScreen';
import AddSavingsGoalScreen from './src/screens/AddSavingsGoalScreen';
import RecurringScreen from './src/screens/RecurringScreen';
import AddRecurringScreen from './src/screens/AddRecurringScreen';
import ChatScreen from './src/screens/ChatScreen';
import AddCategories from './src/screens/AddCategories';
import LoginScreen from './src/screens/LoginScreen';
import DraggableBellIcon from './src/components/DraggableBellIcon';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#075c09" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!state.userToken ? (
        <Stack.Group navigationKey="guest">
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group navigationKey="user">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
          <Stack.Screen name="Transaction" component={Transaction} />
          <Stack.Screen name="Chart" component={Chart} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="AddCategories" component={AddCategories} />
          <Stack.Screen name="Notification" component={Notification} />
          <Stack.Screen name="AddNotification" component={AddNotification} />
          <Stack.Screen name="EditNotification" component={EditNotification} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="SavingsGoals" component={SavingsGoalsScreen} />
          <Stack.Screen name="AddSavingsGoal" component={AddSavingsGoalScreen} />
          <Stack.Screen name="Recurring" component={RecurringScreen} />
          <Stack.Screen name="AddRecurring" component={AddRecurringScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

function AppNavigationShell() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#075c09" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <RootNavigator />
      {state.userToken && <DraggableBellIcon size={50} color="#075c09" />}
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppNavigationShell />
          </NavigationContainer>
        </SafeAreaProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
