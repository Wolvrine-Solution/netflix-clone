import { useRef, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useModalStore } from '../../store/useModalStore'
import { useMyList } from '../../hooks/useMyList'
import { Colors } from '../../constants/colors'
import { getBackdropUrl, truncate, formatRuntime, getReleaseYear } from '../../lib/utils'

const { width } = Dimensions.get('window')
const SNAP_POINTS = ['70%', '95%']

export function ContentModal() {
  const { isOpen, content, closeModal } = useModalStore()
  const { isInList, addToList, removeFromList } = useMyList()
  const sheetRef = useRef<BottomSheet>(null)

  const handleClose = useCallback(() => {
    sheetRef.current?.close()
    closeModal()
  }, [closeModal])

  if (!content) return null

  const inList = isInList(content.id)

  return isOpen ? (
    <>
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: Colors.overlay,
          zIndex: 10,
        }}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>

      <BottomSheet
        ref={sheetRef}
        snapPoints={SNAP_POINTS}
        index={0}
        onClose={closeModal}
        backgroundStyle={{ backgroundColor: Colors.darkGray }}
        handleIndicatorStyle={{ backgroundColor: Colors.lightGray }}
        style={{ zIndex: 11 }}
        enablePanDownToClose
      >
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          {/* Backdrop image */}
          <View style={{ width, aspectRatio: 16 / 9, position: 'relative' }}>
            <Image
              source={{ uri: getBackdropUrl(content.backdropPath) }}
              style={{ flex: 1 }}
              contentFit="cover"
            />
            {/* Close button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.overlay,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleClose}
            >
              <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={{ padding: 16 }}>
            <Text style={{ color: Colors.white, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
              {content.title}
            </Text>

            {/* Action buttons */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.white,
                borderRadius: 4,
                paddingVertical: 10,
                justifyContent: 'center',
                gap: 8,
                marginBottom: 8,
              }}
              onPress={() => {
                closeModal()
                router.push(`/(main)/watch/${content.id}`)
              }}
            >
              <Text style={{ fontSize: 16 }}>▶</Text>
              <Text style={{ color: Colors.black, fontWeight: '700', fontSize: 15 }}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.lightGray,
                borderRadius: 4,
                paddingVertical: 10,
                justifyContent: 'center',
                gap: 8,
                marginBottom: 16,
              }}
              onPress={() => inList ? removeFromList(content.id) : addToList(content.id)}
            >
              <Text style={{ color: Colors.white, fontSize: 18 }}>{inList ? '✓' : '+'}</Text>
              <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 15 }}>
                {inList ? 'In My List' : 'Add to My List'}
              </Text>
            </TouchableOpacity>

            {/* Meta row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
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
              {content.seasons ? (
                <Text style={{ color: Colors.lightGray, fontSize: 13 }}>
                  {content.seasons} Season{content.seasons !== 1 ? 's' : ''}
                </Text>
              ) : null}
              <View style={{ borderWidth: 1, borderColor: Colors.lightGray, paddingHorizontal: 4, paddingVertical: 1 }}>
                <Text style={{ color: Colors.lightGray, fontSize: 10 }}>{content.maturityRating}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={{ color: Colors.white, fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
              {truncate(content.description, 300)}
            </Text>

            {/* Genres */}
            {content.genres.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {content.genres.map((g) => (
                  <View
                    key={g.id}
                    style={{
                      backgroundColor: Colors.mediumGray,
                      borderRadius: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: Colors.lightGray, fontSize: 12 }}>{g.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  ) : null
}
