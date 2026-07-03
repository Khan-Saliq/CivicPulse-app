import base64
import io
import numpy as np
from PIL import Image, ImageFilter, ImageStat
import math
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Hive API credentials
HIVE_API_KEY = os.getenv('HIVE_API_KEY')
HIVE_SECRET_KEY = os.getenv('HIVE_SECRET_KEY')

def call_hive_api(image_base64: str) -> dict:
    """Call Hive V3 Playground API for AI-generated image detection"""
    if not HIVE_SECRET_KEY:
        print("⚠️ Hive API key not configured, using local analysis only")
        return None
    
    try:
        # Prepare image for Hive API
        if ',' in image_base64:
            image_base64_clean = image_base64.split(',')[1]
        else:
            image_base64_clean = image_base64
        
        # Hive V3 Playground API endpoint
        url = "https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection"
        
        # Headers with Bearer token (V3 uses Bearer auth, not Token)
        headers = {
            "Authorization": f"Bearer {HIVE_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        # Request body with base64 image
        payload = {
            "input": [
                {
                    "media_base64": image_base64_clean
                }
            ]
        }
        
        print("🔍 Calling Hive V3 API for AI detection...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Hive API response received")
            
            # Extract AI detection score from V3 response
            output = result.get('output', [{}])[0]
            classes = output.get('classes', [])
            
            # Find AI-generated score
            ai_score = 0
            for cls in classes:
                class_name = cls.get('class', '')
                if class_name == 'ai_generated':
                    ai_score = cls.get('value', 0) * 100
                    print(f"🎯 AI Generated Score: {ai_score:.1f}%")
                    break
            
            return {
                'success': True,
                'ai_score': ai_score,
                'source': 'hive-api-v3',
                'details': classes
            }
        else:
            print(f"❌ Hive API error: {response.status_code} - {response.text[:300]}")
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Hive API timeout")
        return None
    except Exception as e:
        print(f"❌ Hive API error: {str(e)}")
        return None

def analyze_image_ai_detection(image_base64: str) -> dict:
    """
    Comprehensive AI-generated image detection using:
    1. Hive Moderation API (primary - most accurate)
    2. Local forensic analysis (fallback)
    """
    try:
        # Try Hive API first for accurate detection
        print("\n=== AI Detection Started ===")
        hive_result = call_hive_api(image_base64)
        
        if hive_result and hive_result.get('success'):
            ai_score = hive_result['ai_score']
            print(f"🎯 Hive API AI Score: {ai_score:.1f}%")
            
            # Determine if AI-generated
            is_ai_generated = ai_score > 60
            
            # Determine manipulation type
            if ai_score > 75:
                manipulation_type = 'ai-generated'
            elif ai_score > 60:
                manipulation_type = 'likely-ai-generated'
            elif ai_score > 45:
                manipulation_type = 'edited'
            elif ai_score > 30:
                manipulation_type = 'possibly-edited'
            else:
                manipulation_type = 'authentic'
            
            # Generate recommendations
            recommendations = generate_recommendations(ai_score)
            
            return {
                'isManipulated': is_ai_generated,
                'isAIGenerated': manipulation_type in ['ai-generated', 'likely-ai-generated'],
                'manipulationType': manipulation_type,
                'confidence': round(ai_score),
                'artifacts': {
                    'aiGeneration': round(ai_score),
                    'editing': 0,
                    'morphing': 0,
                    'splicing': 0,
                    'posterization': 0,
                    'compressionAnomalies': 0,
                },
                'reasons': [f"🤖 Hive API Analysis: {ai_score:.1f}% AI-generated probability"],
                'recommendations': recommendations,
                'analysisMethod': 'hive-api',
                'metrics': {
                    'hiveAiScore': f"{ai_score:.2f}",
                }
            }
        
        # Fallback to local forensic analysis if Hive API fails
        print("⚠️ Using local forensic analysis (Hive API unavailable)")
        
        # Decode base64 image
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # Check minimum image size
        w, h = image.size
        if w < 50 or h < 50:
            print(f"⚠️ Image too small for analysis ({w}x{h}), using basic checks only")
            return {
                'isManipulated': False,
                'isAIGenerated': False,
                'manipulationType': 'authentic',
                'confidence': 0,
                'artifacts': {
                    'aiGeneration': 0,
                    'editing': 0,
                    'morphing': 0,
                    'splicing': 0,
                    'posterization': 0,
                    'compressionAnomalies': 0,
                },
                'reasons': [f'⚠️ Image too small for detailed analysis ({w}x{h} pixels)'],
                'recommendations': ['📋 Please provide a larger image for accurate detection'],
                'analysisMethod': 'size-check-only',
                'metrics': {
                    'imageWidth': str(w),
                    'imageHeight': str(h),
                }
            }
        
        # Convert to numpy array for analysis
        img_array = np.array(image, dtype=np.float32)
        
        # Run multiple detection techniques
        results = {}
        
        print("Running forensic analysis modules...")
        
        # 1. Noise Pattern Analysis
        results['noise'] = analyze_noise_patterns(img_array)
        print(f"✓ Noise analysis: {results['noise']['score']:.2f}")
        
        # 2. Edge Consistency Analysis
        results['edges'] = analyze_edge_consistency(image)
        print(f"✓ Edge analysis: {results['edges']['score']:.2f}")
        
        # 3. Color Distribution Analysis
        results['color'] = analyze_color_distribution(img_array)
        print(f"✓ Color analysis: {results['color']['score']:.2f}")
        
        # 4. Frequency Domain Analysis
        results['frequency'] = analyze_frequency_domain(img_array)
        print(f"✓ Frequency analysis: {results['frequency']['score']:.2f}")
        
        # 5. Texture Uniformity
        results['texture'] = analyze_texture_uniformity(img_array)
        print(f"✓ Texture analysis: {results['texture']['score']:.2f}")
        
        # 6. Compression Artifacts
        results['compression'] = analyze_compression_artifacts(image_data)
        print(f"✓ Compression analysis: {results['compression']['score']:.2f}")
        
        # Calculate overall AI generation probability
        ai_score = calculate_ai_probability(results)
        
        # Determine if AI-generated
        is_ai_generated = ai_score > 60
        
        # Determine manipulation type
        if ai_score > 75:
            manipulation_type = 'ai-generated'
        elif ai_score > 60:
            manipulation_type = 'likely-ai-generated'
        elif ai_score > 45:
            manipulation_type = 'edited'
        elif ai_score > 30:
            manipulation_type = 'possibly-edited'
        else:
            manipulation_type = 'authentic'
        
        # Generate detailed reasons
        reasons = generate_analysis_reasons(results, ai_score)
        
        # Generate recommendations
        recommendations = generate_recommendations(ai_score)
        
        return {
            'isManipulated': is_ai_generated,
            'isAIGenerated': manipulation_type in ['ai-generated', 'likely-ai-generated'],
            'manipulationType': manipulation_type,
            'confidence': round(ai_score),
            'artifacts': {
                'aiGeneration': round(ai_score),
                'editing': round(results['color']['score'] * 100),
                'morphing': round(results['edges']['score'] * 100),
                'splicing': round(results['texture']['score'] * 100),
                'posterization': 0,
                'compressionAnomalies': round(results['compression']['score'] * 100),
            },
            'reasons': reasons,
            'recommendations': recommendations,
            'analysisMethod': 'python-forensic-analysis',
            'metrics': {
                'noiseUniformity': f"{results['noise']['uniformity']:.2f}",
                'edgeInconsistency': f"{results['edges']['inconsistency']:.2f}",
                'colorDiversity': f"{results['color']['diversity']:.2f}",
                'frequencyAnomaly': f"{results['frequency']['anomaly']:.2f}",
                'textureVariance': f"{results['texture']['variance']:.4f}",
            }
        }
        
    except Exception as e:
        print(f"❌ Error in AI detection: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'isManipulated': False,
            'isAIGenerated': False,
            'manipulationType': 'authentic',
            'confidence': 0,
            'artifacts': {
                'aiGeneration': 0,
                'editing': 0,
                'morphing': 0,
                'splicing': 0,
                'posterization': 0,
                'compressionAnomalies': 0,
            },
            'reasons': [f'❌ Analysis failed: {str(e)}'],
            'recommendations': ['Manual review required'],
            'analysisMethod': 'error-fallback',
            'metrics': {
                'noiseUniformity': '0.00',
                'edgeInconsistency': '0.00',
                'colorDiversity': '0.00',
                'frequencyAnomaly': '0.00',
                'textureVariance': '0.0000',
            },
            'error': str(e)
        }


def analyze_noise_patterns(img_array: np.ndarray) -> dict:
    """Analyze noise patterns - AI images have unnaturally uniform noise"""
    try:
        # Convert to grayscale
        gray = np.mean(img_array, axis=2)
        
        # Apply high-pass filter to extract noise
        from scipy import ndimage
        noise = gray - ndimage.gaussian_filter(gray, sigma=2)
        
        # Calculate noise statistics
        noise_std = np.std(noise)
        noise_mean = np.mean(noise)
        
        # Check uniformity across regions
        h, w = noise.shape
        regions = [
            noise[:h//2, :w//2],
            noise[:h//2, w//2:],
            noise[h//2:, :w//2],
            noise[h//2:, w//2:]
        ]
        
        region_stds = [np.std(r) for r in regions]
        uniformity = 1.0 - (np.std(region_stds) / (np.mean(region_stds) + 1e-10))
        
        # AI images typically have lower noise and higher uniformity
        # Make score proportional to uniformity
        ai_indicator = uniformity * 0.8  # Scale to 0-0.8 range
        if noise_std < 20:
            ai_indicator = min(1.0, ai_indicator + 0.2)
        
        return {
            'std': float(noise_std),
            'uniformity': float(uniformity),
            'score': min(1.0, ai_indicator)
        }
    except Exception as e:
        print(f"Noise analysis error: {e}")
        return {'std': 0, 'uniformity': 0.5, 'score': 0.2}


def analyze_edge_consistency(image: Image.Image) -> dict:
    """Analyze edge consistency - AI often creates inconsistent or blurry edges"""
    try:
        # Convert to grayscale and resize to standard dimensions
        gray = image.convert('L')
        
        # Resize to ensure even dimensions
        w, h = gray.size
        if w % 2 != 0:
            w -= 1
        if h % 2 != 0:
            h -= 1
        
        # Ensure minimum size
        if w < 10 or h < 10:
            return {'inconsistency': 0.5, 'edgeStrength': 0, 'score': 0.2}
        
        gray = gray.resize((w, h))
        
        # Apply different edge detectors
        edges_1 = gray.filter(ImageFilter.FIND_EDGES)
        edges_2 = gray.filter(ImageFilter.CONTOUR)
        
        # Convert to arrays
        edges_1_array = np.array(edges_1, dtype=np.float32)
        edges_2_array = np.array(edges_2, dtype=np.float32)
        
        # Ensure both arrays have the same shape
        min_h = min(edges_1_array.shape[0], edges_2_array.shape[0])
        min_w = min(edges_1_array.shape[1], edges_2_array.shape[1])
        edges_1_array = edges_1_array[:min_h, :min_w]
        edges_2_array = edges_2_array[:min_h, :min_w]
        
        if edges_1_array.size < 2:
            return {'inconsistency': 0.5, 'edgeStrength': 0, 'score': 0.2}
        
        try:
            # Calculate correlation between different edge detection methods
            flat_1 = edges_1_array.flatten()
            flat_2 = edges_2_array.flatten()
            
            if len(flat_1) != len(flat_2):
                min_len = min(len(flat_1), len(flat_2))
                flat_1 = flat_1[:min_len]
                flat_2 = flat_2[:min_len]
            
            correlation = np.corrcoef(flat_1, flat_2)[0, 1]
            inconsistency = 1.0 - abs(correlation) if not np.isnan(correlation) else 0.5
        except:
            inconsistency = 0.5
        
        # Calculate edge sharpness
        try:
            gradient_x = np.diff(edges_1_array, axis=1)
            gradient_y = np.diff(edges_1_array, axis=0)
            edge_magnitude = np.sqrt(gradient_x**2 + gradient_y**2)
            avg_edge_strength = float(np.mean(edge_magnitude))
        except:
            avg_edge_strength = 0
        
        # Make score directly proportional to inconsistency
        # inconsistency ranges from 0 to 1, so use it directly
        ai_indicator = inconsistency  # This gives us 0.97 for 0.97 inconsistency
        
        # Additional boost for blurry edges (AI indicator)
        if 0 < avg_edge_strength < 60:
            ai_indicator = min(1.0, ai_indicator + 0.1)  # Small boost
        
        return {
            'inconsistency': float(inconsistency),
            'edgeStrength': float(avg_edge_strength),
            'score': min(1.0, ai_indicator)
        }
    except Exception as e:
        print(f"Edge analysis error: {e}")
        return {'inconsistency': 0.5, 'edgeStrength': 0, 'score': 0.2}


def analyze_color_distribution(img_array: np.ndarray) -> dict:
    """Analyze color distribution - AI images often have unusual color patterns"""
    try:
        # Calculate color histogram for each channel
        histograms = []
        for channel in range(3):
            hist, _ = np.histogram(img_array[:, :, channel], bins=256, range=(0, 256))
            histograms.append(hist / hist.sum())
        
        # Calculate entropy of color distribution
        entropies = []
        for hist in histograms:
            hist = hist[hist > 0]
            entropy = -np.sum(hist * np.log2(hist))
            entropies.append(entropy)
        
        avg_entropy = np.mean(entropies)
        
        # Calculate color diversity
        unique_colors = len(np.unique(img_array.reshape(-1, 3), axis=0))
        total_pixels = img_array.shape[0] * img_array.shape[1]
        diversity = unique_colors / total_pixels
        
        # AI images often have very high color diversity and specific entropy ranges
        ai_indicator = 0.0
        if diversity > 0.25:
            ai_indicator = min(1.0, diversity * 1.5)  # Scale with diversity
        if 6.0 < avg_entropy < 8.0:
            ai_indicator = min(1.0, ai_indicator + 0.2)
        
        return {
            'entropy': float(avg_entropy),
            'diversity': float(diversity),
            'score': min(1.0, ai_indicator)
        }
    except Exception as e:
        print(f"Color analysis error: {e}")
        return {'entropy': 0, 'diversity': 0, 'score': 0.2}


def analyze_frequency_domain(img_array: np.ndarray) -> dict:
    """Analyze frequency domain - AI images show unusual DCT patterns"""
    try:
        # Convert to grayscale
        gray = np.mean(img_array, axis=2)
        
        # Resize to power of 2 for FFT
        h, w = gray.shape
        new_h = int(2 ** np.floor(np.log2(h)))
        new_w = int(2 ** np.floor(np.log2(w)))
        
        if new_h < 8 or new_w < 8:
            return {'anomaly': 0, 'freqRatio': 0, 'score': 0}
        
        gray_resized = gray[:new_h, :new_w]
        
        # Apply 2D FFT
        fft_result = np.fft.fft2(gray_resized)
        fft_shifted = np.fft.fftshift(fft_result)
        magnitude = np.abs(fft_shifted)
        
        # Analyze frequency distribution
        log_magnitude = np.log(magnitude + 1)
        
        # Calculate ratio of high frequency to low frequency components
        center_y, center_x = new_h // 2, new_w // 2
        radius = min(center_y, center_x)
        
        y, x = np.ogrid[:new_h, :new_w]
        distance = np.sqrt((x - center_x)**2 + (y - center_y)**2)
        
        low_freq_mask = distance < radius * 0.3
        high_freq_mask = distance > radius * 0.7
        
        low_freq_energy = np.sum(log_magnitude[low_freq_mask])
        high_freq_energy = np.sum(log_magnitude[high_freq_mask])
        
        freq_ratio = high_freq_energy / (low_freq_energy + 1e-10)
        
        # AI images often have unusual frequency distributions
        anomaly = 1.0 - min(1.0, freq_ratio * 10)
        
        # Make score directly proportional to anomaly
        ai_indicator = anomaly
        
        return {
            'anomaly': float(anomaly),
            'freqRatio': float(freq_ratio),
            'score': min(1.0, ai_indicator)
        }
    except Exception as e:
        print(f"Frequency analysis error: {e}")
        return {'anomaly': 0, 'freqRatio': 0, 'score': 0.2}


def analyze_texture_uniformity(img_array: np.ndarray) -> dict:
    """Analyze texture uniformity - AI textures are often too uniform"""
    try:
        # Convert to grayscale
        gray = np.mean(img_array, axis=2)
        
        # Divide image into blocks and analyze variance
        block_size = 32
        h, w = gray.shape
        variances = []
        
        for y in range(0, h - block_size, block_size):
            for x in range(0, w - block_size, block_size):
                block = gray[y:y+block_size, x:x+block_size]
                variances.append(np.var(block))
        
        if len(variances) == 0:
            return {'variance': 0, 'uniformity': 0, 'score': 0}
        
        var_mean = np.mean(variances)
        var_std = np.std(variances)
        
        # Low variance std means too uniform (AI indicator)
        uniformity_score = 1.0 - (var_std / (var_mean + 1e-10))
        
        # Make score directly proportional to uniformity
        ai_indicator = uniformity_score
        
        return {
            'variance': float(var_mean),
            'uniformity': float(uniformity_score),
            'score': min(1.0, ai_indicator)
        }
    except Exception as e:
        print(f"Texture analysis error: {e}")
        return {'variance': 0, 'uniformity': 0, 'score': 0.2}


def analyze_compression_artifacts(image_data: bytes) -> dict:
    """Analyze compression artifacts"""
    # Check for multiple compression cycles (editing indicator)
    try:
        image = Image.open(io.BytesIO(image_data))
        format_name = image.format
        
        # JPEG with multiple compressions shows artifacts
        if format_name == 'JPEG':
            # Check quality indicators
            quality_score = 0.3  # Default moderate indicator
            
            # Analyze file size vs dimensions
            width, height = image.size
            file_size_kb = len(image_data) / 1024
            expected_size = (width * height * 3) / 1024  # Raw size in KB
            compression_ratio = file_size_kb / expected_size
            
            if compression_ratio < 0.05:
                quality_score += 0.3  # High compression
            
            return {
                'format': format_name,
                'compressionRatio': compression_ratio,
                'score': min(1.0, quality_score)
            }
    except:
        pass
    
    return {'format': 'unknown', 'compressionRatio': 0, 'score': 0}


def calculate_ai_probability(results: dict) -> float:
    """Calculate overall AI generation probability"""
    weights = {
        'noise': 0.20,
        'edges': 0.25,
        'color': 0.15,
        'frequency': 0.20,
        'texture': 0.15,
        'compression': 0.05
    }
    
    weighted_score = 0
    total_weight = 0
    max_individual_score = 0
    
    print("=== AI Detection Module Scores ===")
    for key, weight in weights.items():
        if key in results:
            score = results[key]['score']
            print(f"{key}: score={score:.3f}, weight={weight}")
            weighted_score += score * weight
            total_weight += weight
            max_individual_score = max(max_individual_score, score)
    
    print(f"Max individual score: {max_individual_score:.3f}")
    
    if total_weight == 0:
        return 0
    
    # Normalize to 0-100 scale
    base_probability = (weighted_score / total_weight) * 100
    print(f"Base probability (weighted avg): {base_probability:.1f}%")
    
    # Boost confidence if ANY module shows strong indicators
    # This prevents strong signals from being diluted by weak ones
    if max_individual_score > 0.8:
        # Very strong indicator in at least one module
        boost = 70 + (max_individual_score - 0.8) * 150
        print(f"STRONG INDICATOR BOOST: {boost:.1f}%")
        base_probability = max(base_probability, boost)
    elif max_individual_score > 0.6:
        # Moderate indicator
        boost = 50 + (max_individual_score - 0.6) * 100
        print(f"MODERATE INDICATOR BOOST: {boost:.1f}%")
        base_probability = max(base_probability, boost)
    elif max_individual_score > 0.4:
        # Weak indicator
        boost = 35 + (max_individual_score - 0.4) * 75
        print(f"WEAK INDICATOR BOOST: {boost:.1f}%")
        base_probability = max(base_probability, boost)
    
    # Additional boost if multiple modules agree
    strong_indicators = sum(1 for key in weights.keys() if key in results and results[key]['score'] > 0.4)
    print(f"Strong indicators count: {strong_indicators}")
    if strong_indicators >= 3:
        base_probability = min(100, base_probability + 15)
    elif strong_indicators >= 2:
        base_probability = min(100, base_probability + 10)
    
    final = min(100, max(0, base_probability))
    print(f"Final confidence: {final:.1f}%")
    print("=================================")
    
    return final


def generate_analysis_reasons(results: dict, ai_score: float) -> list:
    """Generate human-readable analysis reasons"""
    reasons = []
    
    # Only show technical details if there are significant findings
    has_significant_finding = False
    
    if results['noise']['uniformity'] > 0.75:
        reasons.append(f"Noise uniformity: {results['noise']['uniformity']:.2f} (AI images have consistent noise patterns)")
        has_significant_finding = True
    
    if results['edges']['inconsistency'] > 0.5:
        reasons.append(f"Edge inconsistency: {results['edges']['inconsistency']:.2f} (Inconsistent edges suggest AI generation)")
        has_significant_finding = True
    
    if results['color']['diversity'] > 0.25:
        reasons.append(f"High color diversity: {results['color']['diversity']:.2f} (Common in AI-generated content)")
        has_significant_finding = True
    
    if results['frequency']['anomaly'] > 0.4:
        reasons.append(f"Frequency anomalies: {results['frequency']['anomaly']:.2f} (Unusual patterns detected)")
        has_significant_finding = True
    
    if results['texture']['uniformity'] > 0.6:
        reasons.append(f"Texture uniformity: {results['texture']['uniformity']:.2f} (AI textures lack natural variation)")
        has_significant_finding = True
    
    # Show clear conclusion
    if ai_score > 75:
        reasons.insert(0, f"AI-Generated: {ai_score:.0f}% confidence")
    elif ai_score > 60:
        reasons.insert(0, f"Likely AI-Generated: {ai_score:.0f}% confidence")
    elif ai_score > 45:
        reasons.insert(0, f"Possible AI Generation: {ai_score:.0f}% confidence")
    elif ai_score > 30:
        reasons.insert(0, f"Minor Indicators: {ai_score:.0f}% confidence")
    else:
        reasons.insert(0, f"Authentic: {ai_score:.0f}% AI probability")
    
    # If no significant findings, add a note
    if not has_significant_finding and ai_score <= 30:
        reasons.append("No significant AI indicators detected")
    
    return reasons


def generate_recommendations(ai_score: float) -> list:
    """Generate recommendations based on AI score"""
    if ai_score > 75:
        return [
            'Reject this image - High confidence AI generation detected',
            'Request original photo from reporter',
            'Consider rejecting the issue report if no authentic photo provided'
        ]
    elif ai_score > 60:
        return [
            'Flag for manual review - Moderate AI generation indicators',
            'Contact reporter to verify image source',
            'Request additional evidence or original file'
        ]
    elif ai_score > 45:
        return [
            'Review with caution - Possible AI generation detected',
            'Verify image source with reporter',
            'Check for other supporting evidence'
        ]
    elif ai_score > 30:
        return [
            'Proceed with standard validation',
            'Monitor for additional suspicious indicators'
        ]
    else:
        return [
            'Image cleared - No AI generation detected',
            'Proceed with normal issue validation process'
        ]
