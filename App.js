import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { Inter_600SemiBold } from '@expo-google-fonts/inter';
import Svg, { Circle } from 'react-native-svg';

const BUTTONS = [
  { id: 0, color: '#1a5fb4', activeColor: '#3584e4' },
  { id: 1, color: '#c01c28', activeColor: '#e01b24' },
  { id: 2, color: '#26a269', activeColor: '#33d17a' },
  { id: 3, color: '#e5a50a', activeColor: '#f6d32d' },
];

const DIFFICULTY_SETTINGS = {
  beginner: { sequenceLength: 4, speed: 1000 },
  medium: { sequenceLength: 6, speed: 800 },
  hard: { sequenceLength: 8, speed: 600 },
  pro: { sequenceLength: 10, speed: 400 },
};

const DotMatrix = () => (
  <View style={styles.dotMatrix}>
    {Array(6).fill().map((_, i) => (
      <View key={i} style={styles.dotRow}>
        {Array(6).fill().map((_, j) => (
          <View key={j} style={styles.dot} />
        ))}
      </View>
    ))}
  </View>
);

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    Inter_600SemiBold,
  });

  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [difficulty, setDifficulty] = useState('beginner');
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  
  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(1);

  const [clickSoundObject, setClickSoundObject] = useState(null);
  const [failSoundObject, setFailSoundObject] = useState(null);

  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  useEffect(() => {
    if (gameStarted) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [gameStarted]);

  const loadSounds = async () => {
    try {
      const clickSound = new Audio.Sound();
      const failSound = new Audio.Sound();
      
      await clickSound.loadAsync(require('./assets/click.wav'));
      await failSound.loadAsync(require('./assets/fail.wav'));
      
      setClickSoundObject(clickSound);
      setFailSoundObject(failSound);
    } catch (error) {
      console.log('Error loading sounds:', error);
    }
  };

  const unloadSounds = async () => {
    try {
      if (clickSoundObject) await clickSoundObject.unloadAsync();
      if (failSoundObject) await failSoundObject.unloadAsync();
    } catch (error) {
      console.log('Error unloading sounds:', error);
    }
  };

  const playSound = async (isClick = true) => {
    try {
      const soundObject = isClick ? clickSoundObject : failSoundObject;
      if (soundObject) {
        await soundObject.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const generateSequence = () => {
    const newSequence = Array.from(
      { length: DIFFICULTY_SETTINGS[difficulty].sequenceLength },
      () => Math.floor(Math.random() * 4)
    );
    setSequence(newSequence);
    return newSequence;
  };

  const playSequence = async (gameSequence) => {
    setIsPlaying(true);
    for (let i = 0; i < gameSequence.length; i++) {
      await new Promise((resolve) => {
        setTimeout(async () => {
          setActiveButton(gameSequence[i]);
          await playSound(true);
          setTimeout(() => {
            setActiveButton(null);
            resolve();
          }, DIFFICULTY_SETTINGS[difficulty].speed / 2);
        }, DIFFICULTY_SETTINGS[difficulty].speed);
      });
    }
    setIsPlaying(false);
  };

  const handleButtonPress = async (buttonId) => {
    if (isPlaying) return;

    await playSound(true);
    const newPlayerSequence = [...playerSequence, buttonId];
    setPlayerSequence(newPlayerSequence);

    const currentIndex = newPlayerSequence.length - 1;
    if (sequence[currentIndex] !== buttonId) {
      await playSound(false);
      Alert.alert(
        'Game Over!',
        `Final Score: ${score}`,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setGameStarted(false);
              setScore(0);
              setPlayerSequence([]);
            },
          },
        ]
      );
      setHighScores((prevScores) => 
        [...prevScores, score]
          .sort((a, b) => b - a)
          .slice(0, 5)
      );
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      setScore(score + 1);
      setPlayerSequence([]);
      const newSequence = generateSequence();
      setTimeout(() => playSequence(newSequence), 1000);
    }
  };

  const startGame = (selectedDifficulty) => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
    ]).start();

    setGameStarted(true);
    setDifficulty(selectedDifficulty);
    setScore(0);
    setPlayerSequence([]);
    const newSequence = generateSequence();
    playSequence(newSequence);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <DotMatrix />
      
      <View style={styles.header}>
        <Text style={styles.title}>MEMORY</Text>
        <Text style={styles.subtitle}>MASTER</Text>
      </View>

      <Text style={styles.score}>SCORE {String(score).padStart(2, '0')}</Text>

      <Animated.View 
        style={[
          styles.gameGrid,
          {
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {BUTTONS.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={[
              styles.gameButton,
              gameStarted ? 
                { backgroundColor: activeButton === button.id ? button.activeColor : button.color } :
                { backgroundColor: activeButton === button.id ? '#FFFFFF' : '#333333' }
            ]}
            onPress={() => handleButtonPress(button.id)}
          >
            <Animated.View
              style={[
                styles.buttonOverlay,
                {
                  opacity: fadeAnim,
                  backgroundColor: '#FFFFFF',
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </Animated.View>

      {!gameStarted ? (
        <View style={styles.controls}>
          {Object.keys(DIFFICULTY_SETTINGS).map((level) => (
            <TouchableOpacity
              key={level}
              style={styles.difficultyButton}
              onPress={() => startGame(level)}
            >
              <Text style={styles.buttonText}>
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.restartButton}
          onPress={() => {
            setGameStarted(false);
            setScore(0);
            setPlayerSequence([]);
          }}
        >
          <Text style={styles.restartText}>RESTART</Text>
        </TouchableOpacity>
      )}

      <View style={styles.leaderboard}>
        <Text style={styles.leaderboardTitle}>HIGH SCORES</Text>
        {highScores.map((highScore, index) => (
          <Text key={index} style={styles.leaderboardItem}>
            {String(index + 1).padStart(2, '0')} • {String(highScore).padStart(3, '0')}
          </Text>
        ))}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const gameGridSize = width * 0.85;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dotMatrix: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0.1,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  dot: {
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: 40,
    color: '#FFFFFF',
    letterSpacing: 5,
  },
  subtitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 20,
    color: '#666666',
    letterSpacing: 8,
    marginTop: -5,
  },
  score: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 30,
    letterSpacing: 3,
  },
  gameGrid: {
    width: gameGridSize,
    height: gameGridSize,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    padding: 10,
  },
  gameButton: {
    width: '48%',
    height: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  buttonOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 30,
    gap: 10,
  },
  difficultyButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 2,
  },
  restartButton: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  restartText: {
    fontFamily: 'SpaceMono_700Bold',
    color: '#000000',
    fontSize: 16,
    letterSpacing: 2,
  },
  leaderboard: {
    marginTop: 30,
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    width: '100%',
    maxWidth: 300,
  },
  leaderboardTitle: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 15,
    letterSpacing: 2,
  },
  leaderboardItem: {
    fontFamily: 'SpaceMono_400Regular',
    color: '#FFFFFF',
    fontSize: 16,
    marginVertical: 3,
    letterSpacing: 1,
  },
});