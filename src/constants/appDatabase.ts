// Common apps database for search - users can also add custom apps
export interface AppEntry {
  name: string;
  bundleId: string;
  category: string;
}

export const APP_DATABASE: AppEntry[] = [
  // Social Media
  { name: 'Instagram', bundleId: 'com.burbn.instagram', category: 'Social' },
  { name: 'TikTok', bundleId: 'com.zhiliaoapp.musically', category: 'Social' },
  { name: 'Twitter / X', bundleId: 'com.atebits.Tweetie2', category: 'Social' },
  { name: 'Facebook', bundleId: 'com.facebook.Facebook', category: 'Social' },
  { name: 'Snapchat', bundleId: 'com.toyopagroup.picaboo', category: 'Social' },
  { name: 'Reddit', bundleId: 'com.reddit.Reddit', category: 'Social' },
  { name: 'Threads', bundleId: 'com.burbn.barcelona', category: 'Social' },
  { name: 'LinkedIn', bundleId: 'com.linkedin.LinkedIn', category: 'Social' },
  { name: 'Pinterest', bundleId: 'pinterest', category: 'Social' },
  { name: 'Tumblr', bundleId: 'com.tumblr.tumblr', category: 'Social' },
  { name: 'BeReal', bundleId: 'AlexisBarreyworthy.BeReal', category: 'Social' },

  // Messaging
  { name: 'WhatsApp', bundleId: 'net.whatsapp.WhatsApp', category: 'Messaging' },
  { name: 'Telegram', bundleId: 'ph.telegra.Telegraph', category: 'Messaging' },
  { name: 'Discord', bundleId: 'com.hammerandchisel.discord', category: 'Messaging' },
  { name: 'Messenger', bundleId: 'com.facebook.Messenger', category: 'Messaging' },
  { name: 'Signal', bundleId: 'org.whispersystems.signal', category: 'Messaging' },
  { name: 'Slack', bundleId: 'com.tinyspeck.chatlyio', category: 'Messaging' },
  { name: 'WeChat', bundleId: 'com.tencent.xin', category: 'Messaging' },

  // Video & Entertainment
  { name: 'YouTube', bundleId: 'com.google.ios.youtube', category: 'Entertainment' },
  { name: 'Netflix', bundleId: 'com.netflix.Netflix', category: 'Entertainment' },
  { name: 'Twitch', bundleId: 'tv.twitch', category: 'Entertainment' },
  { name: 'Disney+', bundleId: 'com.disney.disneyplus', category: 'Entertainment' },
  { name: 'HBO Max', bundleId: 'com.warnermedia.HBONow', category: 'Entertainment' },
  { name: 'Hulu', bundleId: 'com.hulu.plus', category: 'Entertainment' },
  { name: 'Amazon Prime Video', bundleId: 'com.amazon.aiv.AIVApp', category: 'Entertainment' },
  { name: 'Spotify', bundleId: 'com.spotify.client', category: 'Entertainment' },
  { name: 'Apple Music', bundleId: 'com.apple.Music', category: 'Entertainment' },
  { name: 'SoundCloud', bundleId: 'com.soundcloud.TouchApp', category: 'Entertainment' },
  { name: 'Crunchyroll', bundleId: 'com.crunchyroll.iphone', category: 'Entertainment' },

  // Gaming
  { name: 'Roblox', bundleId: 'com.roblox.robloxmobile', category: 'Gaming' },
  { name: 'Fortnite', bundleId: 'com.epicgames.fortnite', category: 'Gaming' },
  { name: 'Clash Royale', bundleId: 'com.supercell.scroll', category: 'Gaming' },
  { name: 'Candy Crush', bundleId: 'com.king.candycrushsaga', category: 'Gaming' },
  { name: 'Among Us', bundleId: 'com.innersloth.amongus', category: 'Gaming' },
  { name: 'PUBG Mobile', bundleId: 'com.tencent.ig', category: 'Gaming' },
  { name: 'Minecraft', bundleId: 'com.mojang.minecraftpe', category: 'Gaming' },
  { name: 'Genshin Impact', bundleId: 'com.miHoYo.GenshinImpact', category: 'Gaming' },
  { name: 'Call of Duty Mobile', bundleId: 'com.activision.callofduty.shooter', category: 'Gaming' },

  // Shopping
  { name: 'Amazon', bundleId: 'com.amazon.Amazon', category: 'Shopping' },
  { name: 'SHEIN', bundleId: 'com.zzkko.shein', category: 'Shopping' },
  { name: 'Temu', bundleId: 'com.einnovation.temu', category: 'Shopping' },
  { name: 'eBay', bundleId: 'com.ebay.iphone', category: 'Shopping' },
  { name: 'Wish', bundleId: 'com.contextlogic.Wish', category: 'Shopping' },

  // News & Reading
  { name: 'Apple News', bundleId: 'com.apple.news', category: 'News' },
  { name: 'Google News', bundleId: 'com.google.ios.GoogleNews', category: 'News' },
  { name: 'Flipboard', bundleId: 'com.flipboard.flipboard-ipad', category: 'News' },
  { name: 'Medium', bundleId: 'com.medium.reader', category: 'News' },

  // Productivity (some people want to block these too)
  { name: 'Safari', bundleId: 'com.apple.mobilesafari', category: 'Browser' },
  { name: 'Chrome', bundleId: 'com.google.chrome.ios', category: 'Browser' },
  { name: 'Gmail', bundleId: 'com.google.Gmail', category: 'Productivity' },
  { name: 'Outlook', bundleId: 'com.microsoft.Office.Outlook', category: 'Productivity' },

  // Dating
  { name: 'Tinder', bundleId: 'com.cardify.tinder', category: 'Dating' },
  { name: 'Bumble', bundleId: 'com.bumble.app', category: 'Dating' },
  { name: 'Hinge', bundleId: 'co.hinge.app', category: 'Dating' },
];

export function searchApps(query: string): AppEntry[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return APP_DATABASE.filter(
    (app) =>
      app.name.toLowerCase().includes(lower) ||
      app.category.toLowerCase().includes(lower)
  ).slice(0, 15);
}

export function getPopularApps(): AppEntry[] {
  // Return the most commonly blocked apps
  return APP_DATABASE.filter((app) =>
    ['Instagram', 'TikTok', 'Twitter / X', 'YouTube', 'Reddit', 'Snapchat', 'Facebook', 'Netflix', 'Discord', 'Twitch'].includes(app.name)
  );
}
