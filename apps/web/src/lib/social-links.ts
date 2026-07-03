import { 
  Github, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Music, 
  Instagram, 
  Facebook, 
  Globe, 
  Twitch,
  Send
} from "lucide-react";

export function getSocialLinkInfo(url: string) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Fallbacks
    let title = "Web Sitesi";
    let icon = Globe;

    if (hostname.includes("github.com")) {
      title = "GitHub";
      icon = Github;
    } else if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      title = "X (Twitter)";
      icon = Twitter;
    } else if (hostname.includes("linkedin.com")) {
      title = "LinkedIn";
      icon = Linkedin;
    } else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      title = "YouTube";
      icon = Youtube;
    } else if (hostname.includes("spotify.com")) {
      title = "Spotify";
      icon = Music;
    } else if (hostname.includes("instagram.com")) {
      title = "Instagram";
      icon = Instagram;
    } else if (hostname.includes("facebook.com")) {
      title = "Facebook";
      icon = Facebook;
    } else if (hostname.includes("twitch.tv")) {
      title = "Twitch";
      icon = Twitch;
    } else if (hostname.includes("tiktok.com")) {
      title = "TikTok";
      icon = Music; // Fallback for TikTok if icon doesn't exist
    } else if (hostname.includes("t.me") || hostname.includes("telegram.me")) {
      title = "Telegram";
      icon = Send;
    }

    return { 
      title, 
      icon, 
      url: urlObj.href, 
      displayUrl: urlObj.hostname.replace(/^www\./, '') + (urlObj.pathname !== '/' ? urlObj.pathname : '')
    };
  } catch {
    return { 
      title: "Bağlantı", 
      icon: Globe, 
      url: url, 
      displayUrl: url
    };
  }
}
