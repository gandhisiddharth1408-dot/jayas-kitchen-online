import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#777',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
        }}
      />
    </Tabs>
  )
}