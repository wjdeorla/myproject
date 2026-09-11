import 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer, useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  bg: '#0B0B0B',
  surface: '#161616',
  surfaceAlt: '#1E1E1E',
  border: '#2C2C2C',
  text: '#F4F4F4',
  muted: '#8D8D8D',
  faint: '#5C5C5C',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.35)',
};

const LIGHT = {
  bg: '#FFFFFF',
  text: '#111111',
  muted: '#8E8E93',
  chip: '#F2F2F2',
  card: '#F4F4F4',
  border: '#E6E6E6',
  line: '#D8D8D8',
};

const DATES = [
  { day: 'Mon', date: '12', weekday: '월' },
  { day: 'Tue', date: '13', weekday: '화' },
  { day: 'Wed', date: '14', weekday: '수' },
  { day: 'Thu', date: '15', weekday: '목' },
  { day: 'Fri', date: '16', weekday: '금' },
];

const TIMES = ['14:00', '14:30', '15:00', '15:30'];
const BRANCH = {
  name: 'SCENE HAUSE 홍대점',
  address: '서울 마포구 와우산로 21길 20',
  shortName: '홍대 본점',
};
const BOOTH_TYPES = [
  { id: 'solo', name: '솔로 부스', desc: '1~2인 프라이빗 촬영', icon: 'person-outline' },
  { id: 'group', name: '그룹 부스', desc: '3~4인 프라이빗 촬영', icon: 'people-outline' },
  { id: 'motion', name: '모션 부스', desc: '천장형 레일카메라 촬영', icon: 'videocam-outline' },
];

const FEED_ITEMS = [
  {
    id: '1',
    handle: '@vie.node',
    title: 'Hype Boy 미러샷 튜토리얼',
    caption: '부스에서 완벽한 각도로 찍...',
    music: 'Hype Boy - New J',
    source: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: '2',
    handle: '@cjs.dksss',
    title: 'MOKA "It\'s Me" STUDIO',
    caption: 'CHOOM Hype Boy 미러...',
    music: 'It\'s Me - ILLIT',
    source: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: '3',
    handle: '@cjs.dksss',
    title: 'MOKA "It\'s Me" STUDIO',
    caption: 'CHOOM Hype Boy 미러...',
    music: 'Miss you - scens',
    source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
];

const Tab = createBottomTabNavigator();

const DarkNavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: COLORS.bg,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.white,
  },
};

function ScreenShell({ children, edges = ['top'] }) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

function FeedPage({ item, isActive, height, bottomInset }) {
  const videoSource = typeof item.source === 'string' ? item.source : item.source?.uri;
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
  });

  useEffect(() => {
    if (!player) {
      return;
    }

    player.loop = true;
    player.muted = true;

    if (isActive) {
      Promise.resolve(player.play()).catch(() => {});
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <View style={[styles.feedPage, { height }]}>
      {Platform.OS === 'web' ? (
        <View style={[styles.feedVideo, styles.feedVideoFallback]} />
      ) : null}
      <VideoView
        player={player}
        style={styles.feedVideo}
        contentFit="cover"
        nativeControls={false}
        playsInline
      />
      <View style={styles.feedScrim} pointerEvents="none" />

      <View style={[styles.feedBottom, { paddingBottom: bottomInset }]}>
        <View style={styles.feedMeta}>
          <Text style={styles.feedHandle}>{item.handle}</Text>
          <Text style={styles.feedTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.feedCaption} numberOfLines={1}>
            {item.caption}
          </Text>
          <View style={styles.musicChip}>
            <Ionicons name="musical-notes-outline" size={13} color={COLORS.white} />
            <Text style={styles.musicText} numberOfLines={1}>
              {item.music}
            </Text>
          </View>
        </View>

        <View style={styles.feedActions}>
          <Ionicons name="person-outline" size={28} color={COLORS.white} />
          <Ionicons name="heart-outline" size={28} color={COLORS.white} />
          <Ionicons name="chatbubble-outline" size={26} color={COLORS.white} />
          <Ionicons name="bookmark-outline" size={26} color={COLORS.white} />
          <Ionicons name="arrow-redo-outline" size={26} color={COLORS.white} />
        </View>
      </View>
    </View>
  );
}

function HomeFeedScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { height: windowHeight } = useWindowDimensions();
  const [feedTab, setFeedTab] = useState('recommend');
  const [activeId, setActiveId] = useState(FEED_ITEMS[0].id);
  const [pageHeight, setPageHeight] = useState(windowHeight);

  const bottomInset = 86 + insets.bottom;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const nextId = viewableItems[0]?.item?.id;
    if (nextId) {
      setActiveId(nextId);
    }
  }).current;

  const onLayout = useCallback((event) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight > 0) {
      setPageHeight(nextHeight);
    }
  }, []);

  return (
    <View style={styles.feedRoot} onLayout={onLayout}>
      <FlatList
        data={FEED_ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedPage
            item={item}
            isActive={isFocused && item.id === activeId}
            height={pageHeight}
            bottomInset={bottomInset}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={pageHeight}
        snapToAlignment="start"
        disableIntervalMomentum
        getItemLayout={(_, index) => ({
          length: pageHeight,
          offset: pageHeight * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={`${activeId}-${isFocused}`}
      />

      <SafeAreaView style={styles.feedHeader} edges={['top']} pointerEvents="box-none">
        <View style={styles.feedTopBar}>
          <View style={styles.feedTabs}>
            <Pressable onPress={() => setFeedTab('following')} style={styles.feedTabBtn}>
              <Text style={[styles.feedTabText, feedTab !== 'following' && styles.feedTabMuted]}>
                팔로잉
              </Text>
              {feedTab === 'following' ? <View style={styles.feedTabUnderline} /> : null}
            </Pressable>
            <Pressable onPress={() => setFeedTab('recommend')} style={styles.feedTabBtn}>
              <Text style={[styles.feedTabText, feedTab !== 'recommend' && styles.feedTabMuted]}>
                추천
              </Text>
              {feedTab === 'recommend' ? <View style={styles.feedTabUnderline} /> : null}
            </Pressable>
          </View>
          <Pressable style={styles.feedSearch} hitSlop={12}>
            <Ionicons name="search" size={22} color={COLORS.white} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function DummyQR({ seed }) {
  const size = 17;
  const cells = [];
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const inFinder = (x, y) =>
    (x < 5 && y < 5) || (x >= size - 5 && y < 5) || (x < 5 && y >= size - 5);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let on = false;
      if (inFinder(x, y)) {
        const fx = x >= size - 5 ? x - (size - 5) : x;
        const fy = y >= size - 5 ? y - (size - 5) : y;
        on = fx === 0 || fy === 0 || fx === 4 || fy === 4 || (fx === 2 && fy === 2);
      } else {
        on = ((hash + x * 13 + y * 31) >>> 0) % 3 !== 0;
      }
      cells.push(
        <View key={`${x}-${y}`} style={[styles.qrCell, on ? styles.qrCellOn : styles.qrCellOff]} />,
      );
    }
  }

  return <View style={styles.qrGrid}>{cells}</View>;
}

function ReservationTab({ navigation }) {
  const focused = useIsFocused();
  const [step, setStep] = useState('form');
  const [selectedDate, setSelectedDate] = useState('13');
  const [selectedTime, setSelectedTime] = useState('14:30');
  const [selectedBooth, setSelectedBooth] = useState('solo');
  const [reservation, setReservation] = useState(null);

  const dateMeta = DATES.find((item) => item.date === selectedDate) ?? DATES[1];
  const boothMeta = BOOTH_TYPES.find((item) => item.id === selectedBooth) ?? BOOTH_TYPES[0];
  const confirmDateLabel = `2026 . 07 . ${dateMeta.date} (${dateMeta.weekday}) ${selectedTime}`;

  const goBackFromForm = () => {
    if (reservation) {
      setStep('list');
      return;
    }
    navigation.navigate('HomeFeed');
  };

  const submitReservation = () => {
    setReservation({
      branch: BRANCH.shortName,
      branchName: BRANCH.name,
      date: dateMeta.date,
      weekday: dateMeta.weekday,
      time: selectedTime,
      boothId: boothMeta.id,
      boothName: boothMeta.name,
    });
    setStep('confirm');
  };

  const startNewReservation = () => {
    setSelectedDate('13');
    setSelectedTime('14:30');
    setSelectedBooth('solo');
    setStep('form');
  };

  const cancelReservation = () => {
    setReservation(null);
    startNewReservation();
  };

  return (
    <SafeAreaView style={styles.lightSafe} edges={['top']}>
      {focused ? <StatusBar style="dark" /> : null}
      {step === 'form' ? (
        <ScrollView contentContainerStyle={styles.lightPad} showsVerticalScrollIndicator={false}>
          <View style={styles.lightHeader}>
            <Pressable onPress={goBackFromForm} hitSlop={12} style={styles.headerSide}>
              <Ionicons name="chevron-back" size={24} color={LIGHT.text} />
            </Pressable>
            <Text style={styles.lightHeaderTitle}>스튜디오 예약</Text>
            <View style={styles.headerSide} />
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.lightSection}>날짜 선택</Text>
            <Text style={styles.monthLabel}>2026년 7월</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateChipRow}
          >
            {DATES.map((item) => {
              const active = item.date === selectedDate;
              return (
                <Pressable
                  key={item.date}
                  onPress={() => setSelectedDate(item.date)}
                  style={[styles.dateChip, active && styles.dateChipOn]}
                >
                  <Text style={[styles.dateChipDay, active && styles.dateChipOnText]}>{item.day}</Text>
                  <Text style={[styles.dateChipNum, active && styles.dateChipOnText]}>{item.date}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.lightSection, styles.sectionGap]}>지점 및 시간</Text>
          <View style={styles.branchCard}>
            <View style={styles.pinWrap}>
              <Ionicons name="location-outline" size={18} color={LIGHT.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.branchName}>{BRANCH.name}</Text>
              <Text style={styles.branchAddr}>{BRANCH.address}</Text>
            </View>
          </View>
          <View style={styles.timeRow}>
            {TIMES.map((time) => {
              const active = time === selectedTime;
              return (
                <Pressable
                  key={time}
                  onPress={() => setSelectedTime(time)}
                  style={[styles.timeChip, active && styles.timeChipOn]}
                >
                  <Text style={[styles.timeChipText, active && styles.timeChipOnText]}>{time}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.lightSection, styles.sectionGap]}>부스 타입</Text>
          {BOOTH_TYPES.map((booth) => {
            const active = booth.id === selectedBooth;
            return (
              <Pressable
                key={booth.id}
                onPress={() => setSelectedBooth(booth.id)}
                style={[styles.boothCard, active && styles.boothCardOn]}
              >
                <View style={styles.boothIcon}>
                  <Ionicons name={booth.icon} size={22} color={LIGHT.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.boothTitleRow}>
                    <Text style={styles.boothName}>{booth.name}</Text>
                    <Ionicons name="information-circle-outline" size={16} color={LIGHT.muted} />
                  </View>
                  <Text style={styles.boothDesc}>{booth.desc}</Text>
                </View>
              </Pressable>
            );
          })}

          <Pressable style={styles.blackBtn} onPress={submitReservation}>
            <Text style={styles.blackBtnText}>예약하기</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {step === 'confirm' && reservation ? (
        <ScrollView contentContainerStyle={styles.lightPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.confirmTitle}>예약 확정 완료</Text>
          <Text style={styles.confirmSub}>부스 입장을 위한 패스가 발급되었습니다</Text>

          <View style={styles.passShadowCard}>
            <DummyQR seed={`${reservation.date}-${reservation.time}-${reservation.boothId}`} />
            <Text style={styles.passTitle}>SCENE PASS</Text>
            <Text style={styles.passCaption}>오프라인 키오스크에 스캔하세요</Text>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>예약 부스</Text>
              <Text style={styles.detailValue}>{reservation.branch}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>일시</Text>
              <Text style={styles.detailValue}>{confirmDateLabel}</Text>
            </View>
            <View style={[styles.detailRow, { marginBottom: 0 }]}>
              <Text style={styles.detailLabel}>사전 세팅</Text>
              <Text style={styles.detailValue}>{reservation.boothName}</Text>
            </View>
          </View>

          <Pressable
            style={styles.blackBtn}
            onPress={() => {
              setStep('list');
              navigation.navigate('HomeFeed');
            }}
          >
            <Text style={styles.blackBtnText}>홈으로 돌아가기</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {step === 'list' ? (
        <ScrollView contentContainerStyle={styles.lightPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>내 예약</Text>
          {reservation ? (
            <View style={styles.historyCard}>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>예정</Text>
              </View>
              <Text style={styles.historyBranch}>{reservation.branchName}</Text>
              <Text style={styles.historyMeta}>
                {`2026. 07. ${reservation.date} (${reservation.weekday})    오후 ${reservation.time}`}
              </Text>
              <View style={styles.historyActions}>
                <Pressable style={styles.changeBtn} onPress={() => setStep('form')}>
                  <Text style={styles.changeBtnText}>예약 변경</Text>
                </Pressable>
                <Pressable onPress={cancelReservation}>
                  <Text style={styles.cancelLink}>예약 취소</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyHint}>예정된 예약이 없습니다.</Text>
          )}
          <Pressable style={styles.blackBtn} onPress={startNewReservation}>
            <Text style={styles.blackBtnText}>+ 새 예약하기</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function ScenePassScreen() {
  const focused = useIsFocused();

  return (
    <SafeAreaView style={styles.studioSafe} edges={['top']}>
      {focused ? <StatusBar style="dark" /> : null}
      <ScrollView contentContainerStyle={styles.studioPad} showsVerticalScrollIndicator={false}>
        <Text style={styles.studioTitle}>작업실</Text>

        <View style={styles.noticeWrap}>
          <View style={styles.noticeShadow} />
          <View style={styles.noticeCard}>
            <Ionicons name="checkmark-circle-outline" size={36} color={LIGHT.text} />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>원본 영상 도착!</Text>
              <Text style={styles.noticeBody}>
                홍대 본점에서 촬영한 원본이 도착했습니다. 편집을 시작해 보세요.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.thumbCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200&q=80',
            }}
            style={styles.thumbImage}
          />
          <View style={styles.thumbDim} />
          <View style={styles.thumbTag}>
            <Text style={styles.thumbTagText}>원본 00:45</Text>
          </View>
          <View style={styles.playWrap}>
            <Ionicons name="play" size={28} color={LIGHT.bg} style={{ marginLeft: 3 }} />
          </View>
        </View>

        <Pressable style={styles.studioPrimaryBtn}>
          <Text style={styles.studioPrimaryText}>원터치 AI 자동 편집</Text>
        </Pressable>
        <Pressable style={styles.studioSecondaryBtn}>
          <Text style={styles.studioSecondaryText}>직접 편집하기</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function QrScanScreen({ navigation }) {
  const focused = useIsFocused();

  return (
    <SafeAreaView style={styles.qrScanSafe} edges={['top']}>
      {focused ? <StatusBar style="dark" /> : null}
      <ScrollView contentContainerStyle={styles.qrScanPad} showsVerticalScrollIndicator={false}>
        <Text style={styles.qrScanTitle}>QR 스캔</Text>

        <View style={styles.qrPassCard}>
          <Pressable
            style={styles.qrClose}
            onPress={() => navigation.navigate('HomeFeed')}
            hitSlop={12}
          >
            <Ionicons name="close" size={20} color={LIGHT.muted} />
          </Pressable>

          <Text style={styles.qrPassHeading}>SCENE PASS</Text>
          <Text style={styles.qrPassGuide}>부스 입구 리더기에 QR 코드를 스캔하세요.</Text>

          <View style={styles.qrPassCodeWrap}>
            <DummyQR seed="scene-pass-hongdae-solo" />
          </View>

          <View style={styles.qrInfoBox}>
            <View style={styles.qrInfoRow}>
              <Text style={styles.qrInfoLabel}>예약 부스</Text>
              <Text style={styles.qrInfoValue}>솔로 부스</Text>
            </View>
            <View style={[styles.qrInfoRow, { marginBottom: 0 }]}>
              <Text style={styles.qrInfoLabel}>사전 세팅</Text>
              <Text style={styles.qrInfoValue}>좌우 이동 프리셋</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const MY_SHORTS = [
  {
    id: 's1',
    views: '0.6K',
    image: 'https://images.unsplash.com/photo-1535525153412-5a090c909bd7?w=800&q=80',
  },
  {
    id: 's2',
    views: '0.6K',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
  },
];

const SAVED_CHALLENGES = [
  {
    id: 'c1',
    views: '0.6K',
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80',
  },
];

function GalleryCard({ item }) {
  return (
    <View style={styles.galleryCard}>
      <Image source={{ uri: item.image }} style={styles.galleryImage} />
      <View style={styles.galleryChip}>
        <Ionicons name="play" size={10} color={LIGHT.bg} />
        <Text style={styles.galleryChipText}>{item.views}</Text>
      </View>
    </View>
  );
}

function MyPageScreen() {
  const focused = useIsFocused();
  const [tab, setTab] = useState('shorts');
  const items = tab === 'shorts' ? MY_SHORTS : SAVED_CHALLENGES;

  return (
    <SafeAreaView style={styles.profileSafe} edges={['top']}>
      {focused ? <StatusBar style="dark" /> : null}
      <ScrollView contentContainerStyle={styles.profilePad} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>J</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileNameLight}>지유나</Text>
            <Text style={styles.profileHandle}>@Jiyuna_scene</Text>
            <Text style={styles.profileStats}>
              <Text style={styles.profileStatNum}>12</Text>
              <Text style={styles.profileStatLabel}> 결과물   </Text>
              <Text style={styles.profileStatNum}>5</Text>
              <Text style={styles.profileStatLabel}> 예약</Text>
            </Text>
          </View>
        </View>

        <View style={styles.profileSegment}>
          <Pressable
            onPress={() => setTab('shorts')}
            style={[styles.profileSegItem, tab === 'shorts' && styles.profileSegItemOn]}
          >
            <Text style={[styles.profileSegText, tab === 'shorts' && styles.profileSegTextOn]}>
              내 숏폼
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('saved')}
            style={[styles.profileSegItem, tab === 'saved' && styles.profileSegItemOn]}
          >
            <Text style={[styles.profileSegText, tab === 'saved' && styles.profileSegTextOn]}>
              저장한 챌린지
            </Text>
          </Pressable>
        </View>

        <View style={styles.galleryGrid}>
          {items.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function tabIcon(name, focused, color) {
  const iconName = focused ? name : `${name}-outline`;
  return <Ionicons name={iconName} size={22} color={color} />;
}

function FloatingTabBar({ state, descriptors, navigation, insets }) {
  const isHome = state.routes[state.index]?.name === 'HomeFeed';
  const iconColor = isHome ? COLORS.white : LIGHT.text;

  return (
    <View style={[styles.floatingTabWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.floatingTabBar, !isHome && styles.floatingTabBarLight]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={[
                styles.tabHit,
                focused && (isHome ? styles.tabHitActive : styles.tabHitActiveLight),
              ]}
            >
              {options.tabBarIcon({ focused, color: iconColor, size: 22 })}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={DarkNavTheme}>
        <Tab.Navigator
          tabBar={(props) => <FloatingTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
          }}
        >
          <Tab.Screen
            name="HomeFeed"
            component={HomeFeedScreen}
            options={{
              title: '홈 (피드)',
              tabBarLabel: '홈',
              tabBarIcon: ({ focused, color }) => tabIcon('home', focused, color),
            }}
          />
          <Tab.Screen
            name="StudioBooking"
            component={ReservationTab}
            options={{
              title: '스튜디오 예약',
              tabBarLabel: '예약',
              tabBarIcon: ({ focused, color }) => tabIcon('calendar', focused, color),
            }}
          />
          <Tab.Screen
            name="ScenePass"
            component={ScenePassScreen}
            options={{
              title: '작업실',
              tabBarLabel: '작업실',
              tabBarIcon: ({ focused, color }) => tabIcon('cut', focused, color),
            }}
          />
          <Tab.Screen
            name="QrScan"
            component={QrScanScreen}
            options={{
              title: 'QR 스캔',
              tabBarLabel: 'QR',
              tabBarIcon: ({ focused, color }) => tabIcon('grid', focused, color),
            }}
          />
          <Tab.Screen
            name="MyPage"
            component={MyPageScreen}
            options={{
              title: '마이페이지',
              tabBarLabel: '마이',
              tabBarIcon: ({ focused, color }) => tabIcon('person', focused, color),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  pagePad: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  pageSub: {
    color: COLORS.muted,
    marginTop: 6,
    marginBottom: 24,
    fontSize: 13,
  },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateCell: {
    width: 58,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateCellActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  dateDay: {
    color: COLORS.muted,
    fontSize: 11,
  },
  dateNum: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  dateTextActive: {
    color: COLORS.bg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 13,
  },
  chipTextActive: {
    color: COLORS.bg,
    fontWeight: '600',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listRowActive: {
    borderColor: COLORS.white,
  },
  listRowText: {
    color: COLORS.text,
    fontSize: 15,
  },
  listRowTextActive: {
    fontWeight: '600',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryBtnText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  passCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  passEyebrow: {
    color: COLORS.muted,
    letterSpacing: 3,
    fontSize: 12,
    marginBottom: 16,
  },
  qrBox: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passHint: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  passMeta: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  metaLabel: {
    color: COLORS.faint,
    fontSize: 12,
    marginBottom: 4,
  },
  metaValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertTitle: {
    color: COLORS.text,
    fontWeight: '700',
  },
  alertBody: {
    color: COLORS.muted,
    fontSize: 13,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    marginTop: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarLetter: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
  },
  profileName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statNum: {
    color: COLORS.white,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginRight: 8,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentItemActive: {
    backgroundColor: COLORS.white,
  },
  segmentText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  segmentTextActive: {
    color: COLORS.bg,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCell: {
    width: '31.5%',
    aspectRatio: 9 / 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feedRoot: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  feedPage: {
    width: '100%',
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  feedVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  feedVideoFallback: {
    backgroundColor: '#141414',
  },
  feedScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  feedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  feedTopBar: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedTabs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 18,
  },
  feedTabBtn: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  feedTabText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  feedTabMuted: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  feedTabUnderline: {
    marginTop: 4,
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.white,
  },
  feedSearch: {
    position: 'absolute',
    right: 18,
    top: 0,
    height: 44,
    justifyContent: 'center',
  },
  feedBottom: {
    position: 'absolute',
    left: 16,
    right: 14,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  feedMeta: {
    flex: 1,
    paddingRight: 18,
  },
  feedHandle: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  feedTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  feedCaption: {
    color: COLORS.white,
    marginTop: 2,
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  musicChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(0,0,0,0.28)',
    maxWidth: '100%',
  },
  musicText: {
    color: COLORS.white,
    fontSize: 12,
  },
  feedActions: {
    gap: 20,
    alignItems: 'center',
    paddingBottom: 6,
  },
  floatingTabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  floatingTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 28,
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 2,
  },
  tabHit: {
    width: 44,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabHitActive: {
    backgroundColor: '#3A3A3A',
  },
  floatingTabBarLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  tabHitActiveLight: {
    backgroundColor: '#EFEFEF',
  },
  lightSafe: {
    flex: 1,
    backgroundColor: LIGHT.bg,
  },
  lightPad: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  lightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    marginTop: 4,
  },
  headerSide: {
    width: 28,
    height: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  lightHeaderTitle: {
    color: LIGHT.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lightSection: {
    color: LIGHT.text,
    fontSize: 16,
    fontWeight: '700',
  },
  monthLabel: {
    color: LIGHT.muted,
    fontSize: 13,
  },
  sectionGap: {
    marginTop: 26,
    marginBottom: 12,
  },
  dateChipRow: {
    gap: 10,
    paddingRight: 8,
  },
  dateChip: {
    width: 62,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: LIGHT.chip,
  },
  dateChipOn: {
    backgroundColor: LIGHT.text,
  },
  dateChipDay: {
    color: LIGHT.muted,
    fontSize: 11,
  },
  dateChipNum: {
    color: LIGHT.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  dateChipOnText: {
    color: LIGHT.bg,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: LIGHT.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: LIGHT.bg,
  },
  pinWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LIGHT.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchName: {
    color: LIGHT.text,
    fontSize: 15,
    fontWeight: '700',
  },
  branchAddr: {
    color: LIGHT.muted,
    fontSize: 12,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  timeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: LIGHT.chip,
  },
  timeChipOn: {
    backgroundColor: LIGHT.text,
  },
  timeChipText: {
    color: LIGHT.text,
    fontSize: 13,
    fontWeight: '600',
  },
  timeChipOnText: {
    color: LIGHT.bg,
  },
  boothCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: LIGHT.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    backgroundColor: LIGHT.bg,
  },
  boothCardOn: {
    borderColor: LIGHT.text,
    backgroundColor: LIGHT.chip,
  },
  boothIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: LIGHT.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boothTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boothName: {
    color: LIGHT.text,
    fontSize: 15,
    fontWeight: '700',
  },
  boothDesc: {
    color: LIGHT.muted,
    fontSize: 12,
    marginTop: 4,
  },
  blackBtn: {
    marginTop: 18,
    backgroundColor: LIGHT.text,
    borderRadius: 28,
    alignItems: 'center',
    paddingVertical: 16,
  },
  blackBtnText: {
    color: LIGHT.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmTitle: {
    color: LIGHT.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  confirmSub: {
    color: LIGHT.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  passShadowCard: {
    backgroundColor: LIGHT.bg,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: 16,
  },
  qrGrid: {
    width: 170,
    height: 170,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: LIGHT.bg,
  },
  qrCell: {
    width: 10,
    height: 10,
  },
  qrCellOn: {
    backgroundColor: '#111111',
  },
  qrCellOff: {
    backgroundColor: '#FFFFFF',
  },
  passTitle: {
    marginTop: 16,
    color: LIGHT.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  passCaption: {
    marginTop: 6,
    color: LIGHT.muted,
    fontSize: 12,
  },
  detailCard: {
    backgroundColor: LIGHT.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    color: LIGHT.muted,
    fontSize: 13,
  },
  detailValue: {
    color: LIGHT.text,
    fontSize: 13,
    fontWeight: '700',
  },
  listTitle: {
    color: LIGHT.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 18,
  },
  historyCard: {
    borderWidth: 1,
    borderColor: LIGHT.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: LIGHT.bg,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.text,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  statusPillText: {
    color: LIGHT.bg,
    fontSize: 11,
    fontWeight: '700',
  },
  historyBranch: {
    color: LIGHT.text,
    fontSize: 16,
    fontWeight: '700',
  },
  historyMeta: {
    color: LIGHT.muted,
    fontSize: 13,
    marginTop: 6,
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  changeBtn: {
    borderWidth: 1,
    borderColor: LIGHT.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  changeBtnText: {
    color: LIGHT.text,
    fontSize: 13,
    fontWeight: '600',
  },
  cancelLink: {
    color: LIGHT.text,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  emptyHint: {
    color: LIGHT.muted,
    fontSize: 14,
    marginBottom: 8,
  },
  studioSafe: {
    flex: 1,
    backgroundColor: LIGHT.bg,
  },
  studioPad: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  studioTitle: {
    color: LIGHT.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 20,
  },
  noticeWrap: {
    marginBottom: 18,
    marginLeft: 4,
  },
  noticeShadow: {
    position: 'absolute',
    left: -5,
    right: 5,
    top: 5,
    bottom: -5,
    backgroundColor: LIGHT.text,
    borderRadius: 16,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 18,
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    color: LIGHT.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  noticeBody: {
    color: LIGHT.text,
    fontSize: 13,
    lineHeight: 20,
  },
  thumbCard: {
    height: 168,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: LIGHT.card,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  thumbTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(40,40,40,0.55)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  thumbTagText: {
    color: LIGHT.bg,
    fontSize: 12,
    fontWeight: '600',
  },
  playWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioPrimaryBtn: {
    backgroundColor: LIGHT.text,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 10,
  },
  studioPrimaryText: {
    color: LIGHT.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  studioSecondaryBtn: {
    backgroundColor: LIGHT.bg,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: LIGHT.text,
  },
  studioSecondaryText: {
    color: LIGHT.text,
    fontSize: 16,
    fontWeight: '700',
  },
  qrScanSafe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  qrScanPad: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  qrScanTitle: {
    color: LIGHT.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 24,
  },
  qrPassCard: {
    backgroundColor: LIGHT.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LIGHT.border,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  qrClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
  },
  qrPassHeading: {
    color: LIGHT.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  qrPassGuide: {
    color: LIGHT.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  qrPassCodeWrap: {
    marginBottom: 20,
  },
  qrInfoBox: {
    alignSelf: 'stretch',
    backgroundColor: LIGHT.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  qrInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qrInfoLabel: {
    color: LIGHT.text,
    fontSize: 13,
  },
  qrInfoValue: {
    color: LIGHT.text,
    fontSize: 13,
    fontWeight: '700',
  },
  profileSafe: {
    flex: 1,
    backgroundColor: LIGHT.bg,
  },
  profilePad: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    marginBottom: 22,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: LIGHT.bg,
    borderWidth: 1,
    borderColor: LIGHT.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: LIGHT.text,
    fontSize: 28,
    fontWeight: '800',
  },
  profileNameLight: {
    color: LIGHT.text,
    fontSize: 22,
    fontWeight: '800',
  },
  profileHandle: {
    color: LIGHT.muted,
    fontSize: 13,
    marginTop: 2,
  },
  profileStats: {
    marginTop: 8,
  },
  profileStatNum: {
    color: LIGHT.text,
    fontWeight: '800',
    fontSize: 14,
  },
  profileStatLabel: {
    color: LIGHT.muted,
    fontSize: 13,
    fontWeight: '400',
  },
  profileSegment: {
    flexDirection: 'row',
    backgroundColor: LIGHT.chip,
    borderRadius: 24,
    padding: 4,
    marginBottom: 18,
  },
  profileSegItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  profileSegItemOn: {
    backgroundColor: LIGHT.bg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileSegText: {
    color: LIGHT.text,
    fontSize: 14,
    fontWeight: '500',
  },
  profileSegTextOn: {
    fontWeight: '800',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryCard: {
    width: '48%',
    aspectRatio: 0.72,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: LIGHT.card,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20,20,20,0.55)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  galleryChipText: {
    color: LIGHT.bg,
    fontSize: 11,
    fontWeight: '700',
  },
});
