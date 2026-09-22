import { router } from 'expo-router'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO */}
      <View style={styles.hero}>
        <Text style={styles.brand}>Jaya's Kitchen</Text>

        <Text style={styles.tagline}>
          Fresh • Homemade • Pure Veg
        </Text>

        <Text style={styles.heading}>
          Homemade food, made with love.
        </Text>

        <Text style={styles.description}>
          Freshly prepared vegetarian meals made with homemade goodness,
          right here in Manjalpur, Vadodara.
        </Text>

        <TouchableOpacity
          style={styles.orderButton}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/menu')}
        >
          <Text style={styles.orderButtonText}>Order Now</Text>
        </TouchableOpacity>
      </View>

      {/* HIGHLIGHTS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Why Jaya's Kitchen?
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fresh Food</Text>

          <Text style={styles.cardText}>
            Daily freshly prepared homemade food.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            100% Pure Vegetarian
          </Text>

          <Text style={styles.cardText}>
            Delicious pure vegetarian meals prepared with care.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Made with Love</Text>

          <Text style={styles.cardText}>
            Homemade goodness in every meal.
          </Text>
        </View>
      </View>

      {/* ABOUT */}
      <View style={styles.about}>
        <Text style={styles.sectionTitle}>
          About Jaya's Kitchen
        </Text>

        <Text style={styles.aboutText}>
          Homemade food, made with love.
        </Text>

        <Text style={styles.aboutText}>
          📍 Manjalpur, Vadodara
        </Text>

        <Text style={styles.aboutText}>
          🥗 100% Vegetarian
        </Text>

        <Text style={styles.aboutText}>
          🍲 Fresh Homemade Food
        </Text>

        <Text style={styles.aboutText}>
          ❤️ Daily Freshly Prepared
        </Text>
      </View>

      {/* FOOTER */}
      <Text style={styles.footer}>
        Serving with Love & Homemade Goodness ❤️
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },

  content: {
    paddingBottom: 40,
  },

  hero: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 35,
    backgroundColor: '#E8F5E9',
  },

  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 8,
  },

  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#388E3C',
    marginBottom: 24,
  },

  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    lineHeight: 36,
    marginBottom: 14,
  },

  description: {
    fontSize: 16,
    lineHeight: 25,
    color: '#555',
    marginBottom: 24,
  },

  orderButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  section: {
    padding: 24,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 18,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },

  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },

  about: {
    padding: 24,
    backgroundColor: '#F1F8E9',
  },

  aboutText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 12,
  },

  footer: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    padding: 24,
  },
})