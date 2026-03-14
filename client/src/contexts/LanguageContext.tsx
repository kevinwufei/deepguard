import React, { createContext, useContext, useState } from 'react';

type Language = 'zh' | 'en';

interface Translations {
  // Nav
  nav_home: string;
  nav_detect: string;
  nav_history: string;
  nav_audio: string;
  nav_video: string;
  nav_camera: string;
  nav_microphone: string;
  nav_login: string;
  nav_logout: string;
  nav_tagline: string;

  // Home
  home_hero_title: string;
  home_hero_subtitle: string;
  home_hero_cta: string;
  home_hero_cta2: string;
  home_stats_detections: string;
  home_stats_accuracy: string;
  home_stats_speed: string;
  home_stats_detections_label: string;
  home_stats_accuracy_label: string;
  home_stats_speed_label: string;
  home_features_title: string;
  home_features_subtitle: string;
  home_feature_audio_title: string;
  home_feature_audio_desc: string;
  home_feature_video_title: string;
  home_feature_video_desc: string;
  home_feature_camera_title: string;
  home_feature_camera_desc: string;
  home_feature_mic_title: string;
  home_feature_mic_desc: string;
  home_feature_score_title: string;
  home_feature_score_desc: string;
  home_feature_history_title: string;
  home_feature_history_desc: string;
  home_how_title: string;
  home_how_step1: string;
  home_how_step1_desc: string;
  home_how_step2: string;
  home_how_step2_desc: string;
  home_how_step3: string;
  home_how_step3_desc: string;
  home_cta_title: string;
  home_cta_subtitle: string;
  home_cta_btn: string;

  // Detection common
  detect_upload_title: string;
  detect_upload_hint: string;
  detect_analyzing: string;
  detect_result_title: string;
  detect_risk_score: string;
  detect_verdict_safe: string;
  detect_verdict_suspicious: string;
  detect_verdict_deepfake: string;
  detect_analysis_detail: string;
  detect_try_another: string;
  detect_save_result: string;
  detect_saved: string;
  detect_features_detected: string;
  detect_confidence: string;

  // Audio
  audio_title: string;
  audio_subtitle: string;
  audio_formats: string;

  // Video
  video_title: string;
  video_subtitle: string;
  video_formats: string;

  // Camera
  camera_title: string;
  camera_subtitle: string;
  camera_start: string;
  camera_stop: string;
  camera_permission: string;
  camera_analyzing: string;
  camera_live_score: string;

  // Microphone
  mic_title: string;
  mic_subtitle: string;
  mic_start: string;
  mic_stop: string;
  mic_permission: string;
  mic_analyzing: string;
  mic_live_score: string;

  // History
  history_title: string;
  history_subtitle: string;
  history_empty: string;
  history_col_type: string;
  history_col_file: string;
  history_col_time: string;
  history_col_score: string;
  history_col_verdict: string;
  history_login_required: string;
  history_type_audio: string;
  history_type_video: string;
  history_type_camera: string;
  history_type_microphone: string;

  // Footer
  footer_tagline: string;
  footer_rights: string;
}

const zh: Translations = {
  nav_home: '首页',
  nav_detect: '开始检测',
  nav_history: '检测历史',
  nav_audio: '音频检测',
  nav_video: '视频检测',
  nav_camera: '摄像头检测',
  nav_microphone: '麦克风检测',
  nav_login: '登录',
  nav_logout: '退出',
  nav_tagline: 'AI深度伪造检测平台',

  home_hero_title: '识破 AI 伪造，守护真实世界',
  home_hero_subtitle: '利用先进的人工智能技术，实时检测音频和视频中的 Deepfake 内容。保护自己和家人免受 AI 语音克隆、换脸诈骗的侵害。',
  home_hero_cta: '立即开始检测',
  home_hero_cta2: '了解更多',
  home_stats_detections: '100万+',
  home_stats_accuracy: '95%+',
  home_stats_speed: '<5秒',
  home_stats_detections_label: '累计检测次数',
  home_stats_accuracy_label: '检测准确率',
  home_stats_speed_label: '平均分析速度',
  home_features_title: '全方位 Deepfake 防护',
  home_features_subtitle: '覆盖音频、视频、实时通话的完整检测方案，让 AI 诈骗无处遁形',
  home_feature_audio_title: '音频 Deepfake 检测',
  home_feature_audio_desc: '上传 MP3、WAV、M4A 等音频文件，AI 深度分析声纹特征，识别 AI 语音克隆和合成语音',
  home_feature_video_title: '视频 Deepfake 检测',
  home_feature_video_desc: '支持 MP4、WebM 等格式，检测 AI 换脸、人脸替换、表情操控等深度伪造视频',
  home_feature_camera_title: '实时摄像头检测',
  home_feature_camera_desc: '调用浏览器摄像头，对视频通话进行实时 Deepfake 特征分析，即时预警',
  home_feature_mic_title: '实时麦克风检测',
  home_feature_mic_desc: '实时分析麦克风语音流，检测 AI 合成语音痕迹，保护您的通话安全',
  home_feature_score_title: '风险评分系统',
  home_feature_score_desc: '每次检测生成 0-100 分风险评分，并提供详细分析报告，包含异常特征和置信度',
  home_feature_history_title: '检测历史记录',
  home_feature_history_desc: '完整记录所有检测历史，包括文件名、时间、评分，随时回溯查看',
  home_how_title: '三步完成检测',
  home_how_step1: '上传或开启检测',
  home_how_step1_desc: '上传音视频文件，或开启摄像头/麦克风进行实时检测',
  home_how_step2: 'AI 深度分析',
  home_how_step2_desc: '先进 AI 模型对内容进行多维度分析，识别 Deepfake 特征',
  home_how_step3: '获取检测报告',
  home_how_step3_desc: '获得风险评分和详细分析报告，了解检测结果和异常特征',
  home_cta_title: '立即保护您的数字安全',
  home_cta_subtitle: '免费开始使用，无需安装任何软件',
  home_cta_btn: '免费开始检测',

  detect_upload_title: '拖拽文件到此处，或点击上传',
  detect_upload_hint: '支持格式：',
  detect_analyzing: '正在分析中...',
  detect_result_title: '检测结果',
  detect_risk_score: '风险评分',
  detect_verdict_safe: '安全',
  detect_verdict_suspicious: '可疑',
  detect_verdict_deepfake: 'Deepfake',
  detect_analysis_detail: '详细分析',
  detect_try_another: '检测另一个文件',
  detect_save_result: '保存结果',
  detect_saved: '已保存',
  detect_features_detected: '检测到的异常特征',
  detect_confidence: '置信度',

  audio_title: '音频 Deepfake 检测',
  audio_subtitle: '上传音频文件，AI 分析是否为语音克隆或 AI 合成语音',
  audio_formats: 'MP3、WAV、M4A、OGG、FLAC',

  video_title: '视频 Deepfake 检测',
  video_subtitle: '上传视频文件，AI 检测换脸、人脸替换等深度伪造内容',
  video_formats: 'MP4、WebM、MOV、AVI',

  camera_title: '实时摄像头检测',
  camera_subtitle: '开启摄像头，实时检测视频流中的 Deepfake 特征',
  camera_start: '开启摄像头检测',
  camera_stop: '停止检测',
  camera_permission: '请允许浏览器访问摄像头权限',
  camera_analyzing: '正在实时分析...',
  camera_live_score: '实时风险评分',

  mic_title: '实时麦克风检测',
  mic_subtitle: '开启麦克风，实时检测语音流中的 AI 合成痕迹',
  mic_start: '开启麦克风检测',
  mic_stop: '停止检测',
  mic_permission: '请允许浏览器访问麦克风权限',
  mic_analyzing: '正在实时分析...',
  mic_live_score: '实时风险评分',

  history_title: '检测历史记录',
  history_subtitle: '查看您的所有检测记录',
  history_empty: '暂无检测记录',
  history_col_type: '类型',
  history_col_file: '文件名',
  history_col_time: '检测时间',
  history_col_score: '风险评分',
  history_col_verdict: '结论',
  history_login_required: '请登录后查看检测历史',
  history_type_audio: '音频',
  history_type_video: '视频',
  history_type_camera: '摄像头',
  history_type_microphone: '麦克风',

  footer_tagline: '用 AI 对抗 AI，守护数字世界的真实',
  footer_rights: '版权所有',
};

const en: Translations = {
  nav_home: 'Home',
  nav_detect: 'Detect',
  nav_history: 'History',
  nav_audio: 'Audio Detection',
  nav_video: 'Video Detection',
  nav_camera: 'Camera Detection',
  nav_microphone: 'Microphone Detection',
  nav_login: 'Login',
  nav_logout: 'Logout',
  nav_tagline: 'AI Deepfake Detection Platform',

  home_hero_title: 'Expose AI Fakes, Protect Reality',
  home_hero_subtitle: 'Advanced AI technology to detect deepfake audio and video in real-time. Protect yourself and your family from AI voice cloning and face-swap scams.',
  home_hero_cta: 'Start Detection Now',
  home_hero_cta2: 'Learn More',
  home_stats_detections: '1M+',
  home_stats_accuracy: '95%+',
  home_stats_speed: '<5s',
  home_stats_detections_label: 'Total Detections',
  home_stats_accuracy_label: 'Detection Accuracy',
  home_stats_speed_label: 'Avg Analysis Speed',
  home_features_title: 'Complete Deepfake Protection',
  home_features_subtitle: 'Full coverage for audio, video, and live calls — making AI fraud impossible to hide',
  home_feature_audio_title: 'Audio Deepfake Detection',
  home_feature_audio_desc: 'Upload MP3, WAV, M4A files. AI deeply analyzes voice patterns to identify AI voice cloning and synthetic speech',
  home_feature_video_title: 'Video Deepfake Detection',
  home_feature_video_desc: 'Supports MP4, WebM formats. Detects AI face-swap, face replacement, and expression manipulation',
  home_feature_camera_title: 'Real-time Camera Detection',
  home_feature_camera_desc: 'Use browser camera for real-time deepfake analysis during video calls with instant alerts',
  home_feature_mic_title: 'Real-time Mic Detection',
  home_feature_mic_desc: 'Real-time analysis of microphone audio stream to detect AI synthetic voice traces',
  home_feature_score_title: 'Risk Scoring System',
  home_feature_score_desc: 'Each detection generates a 0-100 risk score with detailed analysis report including anomaly features and confidence',
  home_feature_history_title: 'Detection History',
  home_feature_history_desc: 'Complete record of all detection history including filename, time, and scores for easy review',
  home_how_title: 'Three Steps to Detect',
  home_how_step1: 'Upload or Enable Detection',
  home_how_step1_desc: 'Upload audio/video files, or enable camera/microphone for real-time detection',
  home_how_step2: 'AI Deep Analysis',
  home_how_step2_desc: 'Advanced AI models analyze content across multiple dimensions to identify deepfake features',
  home_how_step3: 'Get Detection Report',
  home_how_step3_desc: 'Receive risk score and detailed analysis report with anomaly features and confidence levels',
  home_cta_title: 'Protect Your Digital Security Now',
  home_cta_subtitle: 'Start for free — no software installation required',
  home_cta_btn: 'Start Free Detection',

  detect_upload_title: 'Drag & drop file here, or click to upload',
  detect_upload_hint: 'Supported formats: ',
  detect_analyzing: 'Analyzing...',
  detect_result_title: 'Detection Result',
  detect_risk_score: 'Risk Score',
  detect_verdict_safe: 'Safe',
  detect_verdict_suspicious: 'Suspicious',
  detect_verdict_deepfake: 'Deepfake',
  detect_analysis_detail: 'Detailed Analysis',
  detect_try_another: 'Detect Another File',
  detect_save_result: 'Save Result',
  detect_saved: 'Saved',
  detect_features_detected: 'Detected Anomaly Features',
  detect_confidence: 'Confidence',

  audio_title: 'Audio Deepfake Detection',
  audio_subtitle: 'Upload audio files to detect AI voice cloning and synthetic speech',
  audio_formats: 'MP3, WAV, M4A, OGG, FLAC',

  video_title: 'Video Deepfake Detection',
  video_subtitle: 'Upload video files to detect face-swap and deepfake manipulation',
  video_formats: 'MP4, WebM, MOV, AVI',

  camera_title: 'Real-time Camera Detection',
  camera_subtitle: 'Enable camera for real-time deepfake feature analysis in video streams',
  camera_start: 'Start Camera Detection',
  camera_stop: 'Stop Detection',
  camera_permission: 'Please allow browser access to camera',
  camera_analyzing: 'Analyzing in real-time...',
  camera_live_score: 'Live Risk Score',

  mic_title: 'Real-time Microphone Detection',
  mic_subtitle: 'Enable microphone for real-time AI synthetic voice detection',
  mic_start: 'Start Mic Detection',
  mic_stop: 'Stop Detection',
  mic_permission: 'Please allow browser access to microphone',
  mic_analyzing: 'Analyzing in real-time...',
  mic_live_score: 'Live Risk Score',

  history_title: 'Detection History',
  history_subtitle: 'View all your detection records',
  history_empty: 'No detection records yet',
  history_col_type: 'Type',
  history_col_file: 'File Name',
  history_col_time: 'Detection Time',
  history_col_score: 'Risk Score',
  history_col_verdict: 'Verdict',
  history_login_required: 'Please login to view detection history',
  history_type_audio: 'Audio',
  history_type_video: 'Video',
  history_type_camera: 'Camera',
  history_type_microphone: 'Microphone',

  footer_tagline: 'Fighting AI with AI — protecting the truth in the digital world',
  footer_rights: 'All rights reserved',
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'zh',
  setLang: () => {},
  t: zh,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('deepguard_lang');
    return (saved as Language) || 'zh';
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('deepguard_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t: lang === 'zh' ? zh : en }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
