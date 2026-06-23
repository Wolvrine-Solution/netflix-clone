import { View, Text, TouchableOpacity, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useModalStore } from '../../store/useModalStore'
import { Colors } from '../../constants/colors'
import { getBackdropUrl, truncate, formatRuntime, getReleaseYear } from '../../lib/utils'
import type { ContentItem } from '@netflix/types'

const { width } = Dimensions.get('window')

interface HeroBannerProps {
  content: ContentItem | null
}

export function HeroBanner({ content }: HeroBannerProps) {
  const openModal = useModalStore((s) => s.openModal)

  if (!content) return null

  return (
    <View style={{ width, height: width * 0.75, position: 'relative' }}>
      {/* Backdrop */}
      <Image
        source={{ uri: getBackdropUrl(content.backdropPath) }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        contentFit="cover"
      />

      {/* Gradient overlays */}
      <LinearGradient
        colors={['transparent', Colors.black]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }}
      />
      <LinearGradient
        colors={[Colors.overlayLight, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Content info */}
      <View style={{ position: 'absolute', bottom: 24, left: 16, right: 80 }}>
        {/* Title */}
        <Text style={{ color: Colors.white, fontSize: 28, fontWeight: '900', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
          {content.title}
        </Text>

        {/* Meta */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Text style={{ color: '#46D369', fontSize: 13, fontWeight: '700' }}>
            {Math.round(content.rating * 10)}% Match
          </Text>
          <Text style={{ color: Colors.lightGray, fontSize: 13 }}>
            {getReleaseYear(content.releaseDate)}
          </Text>
          {content.runtime ? (
            <Text style={{ color: Colors.lightGray, fontSize: 13 }}>
              {formatRuntime(content.runtime)}
            </Text>
          ) : null}
          <View style={{ borderWidth: 1, borderColor: Colors.lightGray, paddingHorizontal: 4, paddingVertical: 1 }}>
            <Text style={{ color: Colors.lightGray, fontSize: 10 }}>{content.maturityRating}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.white,
              borderRadius: 4,
              paddingHorizontal: 20,
              paddingVertical: 8,
              gap: 6,
            }}
            onPress={() => router.push(`/(main)/watch/${content.id}`)}
          >
            <Text style={{ fontSize: 16 }}>▶</Text>
            <Text style={{ color: Colors.black, fontWeight: '700', fontSize: 15 }}>Play</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.overlayLight,
              borderRadius: 4,
              paddingHorizontal: 16,
              paddingVertical: 8,
              gap: 6,
            }}
            onPress={() => openModal(content)}
          >
            <Text style={{ fontSize: 16, color: Colors.white }}>ℹ</Text>
            <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 15 }}>More Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
