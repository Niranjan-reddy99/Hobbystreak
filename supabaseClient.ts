
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

// User provided credentials
const PROJECT_URL = 'https://vfnwapcfycnpgbnsubic.supabase.co';

// CORRECT ANON KEY (Public Key) - Starts with 'ey...'
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbndhcGNmeWNucGdibnN1YmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDc4OTAsImV4cCI6MjA4MDgyMzg5MH0.sPZu-Woe8I9HhefTP12TLVn_cfmDvko6Thude4y5kdk';

export const supabase = createClient(PROJECT_URL, API_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// Helper to check if key exists
export const isKeyValid = () => {
    return !!API_KEY && API_KEY.length > 0;
};

// Helper to check if the key format looks like a valid Supabase Anon Key (JWT)
export const isKeyFormatCorrect = () => {
    return API_KEY.startsWith('ey');
};

export const mapSupabaseUserToAppUser = (sbUser: any, profile: any): User => {
    return {
        id: sbUser.id,
        name: profile?.full_name || sbUser.email?.split('@')[0] || 'User',
        avatar: profile?.avatar_url || 'https://picsum.photos/150/150',
        bio: profile?.bio || 'Ready to start a streak.',
        joinedHobbies: [], // Fetched separately
        hobbyStreaks: {}, // Fetched separately
        privacySettings: { profileVisibility: 'public' },
        following: [],
        followers: [],
        stats: {
            streak: profile?.streak || 0,
            totalPoints: profile?.total_points || 0,
            lastLogDate: null,
            totalLogs: 0
        },
        unlockedAchievements: [],
        dailyChallenges: []
    };
};
