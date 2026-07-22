import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Text, TouchableOpacity, ScrollView, Image } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import * as ScreenOrientation from 'expo-screen-orientation'
import { api } from '../../../lib/api'
import { VideoPlayer } from '../../../components/player/VideoPlayer'
import { useSettingsStore } from '../../../store/useSettingsStore'
import { Colors } from '../../../constants/colors'

interface Episode {
  id: string
  episodeNumber: number
  title: string
  runtime?: number | null
  stillPath?: string | null
  videoUrl?: string | null
}
interface Season {
  id: string
  seasonNumber: number
  title?: string | null
  episodes: Episode[]
}
interface ContentData {
  id: string
  title: string
  mediaType: string
  videoUrl?: string | null
  videoFiles?: Array<{ url: string; isDefault: boolean }>
  contentSeasons?: Season[]
  [key: string]: unknown
}

export default function WatchScreen() {
  const { contentId } = useLocalSearchParams<{ contentId: string }>()
  const { autoPlay } = useSettingsStore()
  const [currentSeason, setCurrentSeason] = useState(1)
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [activeSeason, setActiveSeason] = useState(1)

  const { data: content, isLoading } = useQuery({
    queryKey: ['content-full', contentId],
    queryFn: () => api.content(contentId!).then((r) => r.data.data as ContentData),
    enabled: !!contentId,
  })

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
    }
  }, [])

  if (isLoading || !content) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.black,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={Colors.red} />
      </View>
    )
  }

  const seasons = content.contentSeasons ?? []
  const isTVWithSeasons = content.mediaType === 'tv' && seasons.length > 0

  let videoUrl: string | null = content.videoUrl ?? null
  let episodeInfo: { season: number; episode: number; title: string } | null = null

  if (isTVWithSeasons) {
    const season = seasons.find((s) => s.seasonNumber === currentSeason) ?? seasons[0]
    const episode =
      season?.episodes.find((e) => e.episodeNumber === currentEpisode) ?? season?.episodes[0]
    if (episode) {
      videoUrl = episode.videoUrl ?? videoUrl
      episodeInfo = {
        season: season!.seasonNumber,
        episode: episode.episodeNumber,
        title: episode.title,
      }
    }
  } else if (content.videoFiles?.length) {
    videoUrl = content.videoFiles[0]?.url ?? videoUrl
  }

  function getNextEpisode() {
    if (!isTVWithSeasons) return null
    const season = seasons.find((s) => s.seasonNumber === currentSeason)
    if (!season) return null
    const idx = season.episodes.findIndex((e) => e.episodeNumber === currentEpisode)
    if (idx < season.episodes.length - 1)
      return { season: currentSeason, episode: season.episodes[idx + 1]!.episodeNumber }
    const nextSeason = seasons.find((s) => s.seasonNumber === currentSeason + 1)
    if (nextSeason?.episodes.length)
      return { season: nextSeason.seasonNumber, episode: nextSeason.episodes[0]!.episodeNumber }
    return null
  }

  function getPrevEpisode() {
    if (!isTVWithSeasons) return null
    const season = seasons.find((s) => s.seasonNumber === currentSeason)
    if (!season) return null
    const idx = season.episodes.findIndex((e) => e.episodeNumber === currentEpisode)
    if (idx > 0) return { season: currentSeason, episode: season.episodes[idx - 1]!.episodeNumber }
    const prevSeason = seasons.find((s) => s.seasonNumber === currentSeason - 1)
    if (prevSeason?.episodes.length) {
      const last = prevSeason.episodes[prevSeason.episodes.length - 1]!
      return { season: prevSeason.seasonNumber, episode: last.episodeNumber }
    }
    return null
  }

  const next = getNextEpisode()
  const prev = getPrevEpisode()
  const currentSeasonData = seasons.find((s) => s.seasonNumber === activeSeason) ?? seasons[0]

  return (
    <View style={{ flex: 1, backgroundColor: Colors.black }}>
      <VideoPlayer
        content={content as Parameters<typeof VideoPlayer>[0]['content']}
        videoUrl={videoUrl ?? undefined}
        episodeInfo={episodeInfo}
        onBack={() => router.back()}
        onNext={
          next && autoPlay
            ? () => {
                setCurrentSeason(next.season)
                setCurrentEpisode(next.episode)
              }
            : undefined
        }
        onPrev={
          prev
            ? () => {
                setCurrentSeason(prev.season)
                setCurrentEpisode(prev.episode)
              }
            : undefined
        }
        onShowEpisodes={isTVWithSeasons ? () => setShowEpisodes(true) : undefined}
      />

      {/* Episode panel */}
      {showEpisodes && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 280,
            backgroundColor: Colors.darkGray,
            borderLeftWidth: 1,
            borderLeftColor: Colors.mediumGray,
          }}
        >
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: Colors.mediumGray,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 16 }}>
              {content.title as string}
            </Text>
            <TouchableOpacity onPress={() => setShowEpisodes(false)} activeOpacity={0.7}>
              <Text style={{ color: Colors.lightGray, fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {seasons.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ maxHeight: 44 }}
              contentContainerStyle={{ padding: 8, flexDirection: 'row', gap: 8 }}
            >
              {seasons.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setActiveSeason(s.seasonNumber)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor:
                      activeSeason === s.seasonNumber ? Colors.red : Colors.mediumGray,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: Colors.white, fontSize: 12, fontWeight: '600' }}>
                    S{s.seasonNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 8 }}>
            {currentSeasonData?.episodes.map((ep) => {
              const isActive = currentSeason === activeSeason && currentEpisode === ep.episodeNumber
              return (
                <TouchableOpacity
                  key={ep.id}
                  onPress={() => {
                    setCurrentSeason(activeSeason)
                    setCurrentEpisode(ep.episodeNumber)
                    setShowEpisodes(false)
                  }}
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    padding: 8,
                    borderRadius: 10,
                    marginBottom: 4,
                    backgroundColor: isActive ? `${Colors.red}30` : 'transparent',
                    borderWidth: isActive ? 1 : 0,
                    borderColor: isActive ? `${Colors.red}60` : 'transparent',
                  }}
                  activeOpacity={0.7}
                >
                  {ep.stillPath ? (
                    <Image
                      source={{ uri: ep.stillPath }}
                      style={{ width: 80, height: 45, borderRadius: 4 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 80,
                        height: 45,
                        borderRadius: 4,
                        backgroundColor: Colors.mediumGray,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: Colors.lightGray, fontSize: 18 }}>▶</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text
                      style={{
                        color: isActive ? Colors.red : Colors.white,
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                      numberOfLines={2}
                    >
                      {ep.episodeNumber}. {ep.title}
                    </Text>
                    {ep.runtime && (
                      <Text style={{ color: Colors.lightGray, fontSize: 11, marginTop: 2 }}>
                        {ep.runtime}m
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
