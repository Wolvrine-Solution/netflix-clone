import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { QueryClient, QueryClientProvider } from "react-query";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { HomeScreen } from "@/screens/HomeScreen";
import { ResultsScreen } from "@/screens/ResultsScreen";
import { RecordingScreen } from "@/screens/RecordingScreen";

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  const [fontsLoaded] = useFonts({
    "Inter-Regular": Inter_400Regular,
    "Inter-Bold": Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: "#0F0F13" },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Recording" component={RecordingScreen} />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ gestureEnabled: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar barStyle="light-content" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
