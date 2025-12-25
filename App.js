import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Clipboard,
  ScrollView,
  Linking,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { File } from 'expo-file-system';
import Constants from 'expo-constants';
import { analyzeChessPosition } from './src/api/openai';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// API key loaded securely from environment variables
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || '';

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fenResult, setFenResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Take a photo
  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const photoResult = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced',
      });
      console.log('Photo taken:', photoResult.path);
      setPhoto(photoResult);
      setFenResult(null);
      setError(null);
    } catch (err) {
      console.error('Failed to take photo:', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  }, []);

  // Clear the photo and results
  const clearPhoto = useCallback(() => {
    setPhoto(null);
    setFenResult(null);
    setError(null);
  }, []);

  // Analyze the photo with Grok Vision
  const analyzePhoto = useCallback(async () => {
    if (!photo) return;

    if (!OPENAI_API_KEY) {
      Alert.alert(
        'API Key Missing',
        'OPENAI_API_KEY not found. Make sure .env file exists with your API key.',
      );
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Read the photo file and convert to base64
      const photoUri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

      const file = new File(photoUri);
      const base64Image = await file.base64();

      console.log('Sending image to GPT-4o Vision API...');
      const result = await analyzeChessPosition(base64Image, OPENAI_API_KEY);
      console.log('FEN Result:', result);

      if (result.startsWith('ERROR:')) {
        setError(result);
      } else {
        setFenResult(result);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  }, [photo]);

  // Copy FEN to clipboard
  const copyFen = useCallback(() => {
    if (fenResult) {
      Clipboard.setString(fenResult);
      Alert.alert('Copied!', 'FEN notation copied to clipboard');
    }
  }, [fenResult]);

  // Open position in Lichess for analysis
  const openInLichess = useCallback(() => {
    if (fenResult) {
      // Lichess uses FEN in path with spaces replaced by underscores
      const fenForUrl = fenResult.trim().replace(/ /g, '_');
      const url = `https://lichess.org/analysis/${fenForUrl}`;
      console.log('Opening Lichess URL:', url);
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open Lichess');
      });
    }
  }, [fenResult]);

  // Permission states
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission denied</Text>
        <Text style={styles.button} onPress={requestPermission}>
          Grant Permission
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No camera device found</Text>
      </View>
    );
  }

  // Show photo preview and results
  if (photo) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: `file://${photo.path}` }}
          style={styles.previewImage}
          resizeMode="contain"
        />

        {/* Results section */}
        <View style={styles.resultsContainer}>
          {analyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a9eff" />
              <Text style={styles.loadingText}>Analyzing chess position...</Text>
            </View>
          )}

          {error && !analyzing && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {fenResult && !analyzing && (
            <View style={styles.fenContainer}>
              <Text style={styles.fenLabel}>FEN Notation:</Text>
              <ScrollView horizontal style={styles.fenScrollView}>
                <Text style={styles.fenText} selectable>{fenResult}</Text>
              </ScrollView>
              <TouchableOpacity style={styles.copyButton} onPress={copyFen}>
                <Text style={styles.copyButtonText}>Copy FEN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Control buttons */}
        <View style={styles.photoControls}>
          <TouchableOpacity style={styles.controlButton} onPress={clearPhoto}>
            <Text style={styles.controlButtonText}>Retake</Text>
          </TouchableOpacity>

          {!fenResult && !analyzing && (
            <TouchableOpacity
              style={[styles.controlButton, styles.useButton]}
              onPress={analyzePhoto}
            >
              <Text style={styles.controlButtonText}>Analyze</Text>
            </TouchableOpacity>
          )}

          {fenResult && (
            <TouchableOpacity
              style={[styles.controlButton, styles.lichessButton]}
              onPress={openInLichess}
            >
              <Text style={styles.controlButtonText}>Lichess</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Capture button */}
      <View style={styles.captureContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Chess Vision - Take a photo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  button: {
    color: '#4a9eff',
    fontSize: 16,
    textAlign: 'center',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  resultsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 8,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
  fenContainer: {
    alignItems: 'center',
  },
  fenLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  fenScrollView: {
    maxWidth: '100%',
  },
  fenText: {
    color: '#4a9eff',
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  copyButton: {
    marginTop: 12,
    backgroundColor: '#4a9eff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  photoControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  useButton: {
    backgroundColor: '#4a9eff',
    borderColor: '#4a9eff',
  },
  lichessButton: {
    backgroundColor: '#629924',
    borderColor: '#629924',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
