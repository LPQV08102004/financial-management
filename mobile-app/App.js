import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import Transaction from './src/screens/Transaction';
import Chart from './src/screens/Chart';
import Notification from './src/screens/Notification';
import AddNotification from './src/screens/AddNotification';
import EditNotification from './src/screens/EditNotification';
import Profile from './src/screens/Profile';
import LoginScreen from './src/screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
          <Stack.Screen name="Transaction" component={Transaction} />
          <Stack.Screen name="Chart" component={Chart} />
          <Stack.Screen name="Notification" component={Notification} />
          <Stack.Screen name="AddNotification" component={AddNotification} />
          <Stack.Screen name="EditNotification" component={EditNotification} />
          <Stack.Screen name="Profile" component={Profile} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}


// import { View } from 'react-native';

// export default function App() {
//   return <View style={{ flex: 1, backgroundColor: 'red' }} />;
// }