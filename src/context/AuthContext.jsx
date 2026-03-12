import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [state, setState] = useState({
        user: null,
        profile: null,
        loading: true
    });

    // Track state in refs to avoid stale closures in effects and listeners
    const userRef = useRef(null);
    const profileRef = useRef(null);
    const fetchInProgress = useRef(null);

    // Atomic update helper
    const updateAuth = (updates) => {
        setState(prev => {
            const newState = { ...prev, ...updates };
            // Keep refs in sync for event handlers
            if (updates.user !== undefined) userRef.current = updates.user;
            if (updates.profile !== undefined) profileRef.current = updates.profile;
            return newState;
        });
    };

    const handleSession = async (session, source = 'unknown') => {
        const sessionUser = session?.user || null;

        // Use a local snapshot of refs to detect if something changed during await
        const currentRefUser = userRef.current;
        const currentRefProfile = profileRef.current;

        console.log(`[AuthState] 🔍 Session Check (${source}):`, {
            userId: sessionUser?.id,
            cachedId: currentRefUser?.id,
            hasProfile: !!currentRefProfile
        });

        if (!sessionUser) {
            console.log('[AuthState] 🚪 No session');
            updateAuth({ user: null, profile: null, loading: false });
            return;
        }

        const isNewUser = currentRefUser?.id !== sessionUser.id;

        if (isNewUser || !currentRefProfile) {
            console.log('[AuthState] 📥 Loading profile...', { isNewUser, missingProfile: !currentRefProfile });

            // On refresh/initial, give Supabase a moment to handle everything internally
            if (state.loading) {
                console.log('[AuthState] ⏱️ Initial load delay...');
                await new Promise(r => setTimeout(r, 300));
            }

            updateAuth({ user: sessionUser, profile: null, loading: true });
            await fetchProfile(sessionUser.id);
        } else {
            console.log('[AuthState] ✅ Session valid');
            updateAuth({ user: sessionUser, loading: false });
        }
    };

    useEffect(() => {
        let isMounted = true;
        let initialized = false;

        const start = async () => {
            console.log('[AuthState] ⚙️ Startup');

            // Immediate check
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted && session && !initialized) {
                    initialized = true;
                    await handleSession(session, 'init_sync');
                }
            } catch (e) {
                console.error('[AuthState] Init fetch error:', e);
            }

            // Listen for changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    if (!isMounted) return;
                    console.log('[AuthState] 📡 Event:', event);

                    if (event === 'SIGNED_OUT') {
                        updateAuth({ user: null, profile: null, loading: false });
                        initialized = true;
                    } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        // If we didn't init yet, or it's a new sign in
                        if (!initialized || event === 'SIGNED_IN') {
                            initialized = true;
                            await handleSession(session, `event_${event.toLowerCase()}`);
                        }
                    }
                }
            );

            return () => subscription.unsubscribe();
        };

        const subPromise = start();

        const safetyTimer = setTimeout(() => {
            if (isMounted && state.loading) {
                console.log('[AuthState] 🚨 Fatal timeout - clearing loading');
                updateAuth({ loading: false });
            }
        }, 5000);

        return () => {
            isMounted = false;
            clearTimeout(safetyTimer);
            subPromise.then(unsub => unsub && unsub());
        };
    }, []);

    async function fetchProfile(userId) {
        if (!userId) {
            updateAuth({ loading: false });
            return;
        }

        if (fetchInProgress.current === userId) {
            console.log('[AuthFetch] ⏩ Skip (active)');
            // If skipped but we are still in a loading state, we need to ensure it eventually clears
            return;
        }

        fetchInProgress.current = userId;

        try {
            console.log('[AuthFetch] 🛰️ Fetching from DB...');

            // Profile fetch with 8s timeout to prevent permanent hang
            const profilePromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 8000)
            );

            const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

            if (error) {
                console.error('[AuthFetch] ❌ Error:', error);
                updateAuth({ profile: null, loading: false });
            } else {
                console.log('[AuthFetch] ✨ Success');
                updateAuth({ profile: data, loading: false });
            }
        } catch (err) {
            console.error('[AuthFetch] 🔥 Fail:', err.message);
            updateAuth({ profile: null, loading: false });
        } finally {
            console.log('[AuthFetch] 🏁 Done');
            fetchInProgress.current = null;
        }
    }

    async function signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    }

    async function signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        await supabase.auth.signOut();
        updateAuth({ user: null, profile: null, loading: false });
    }

    async function updateProfile(updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userRef.current?.id)
            .select()
            .single();

        if (error) throw error;
        updateAuth({ profile: data });
        return data;
    }

    const value = useMemo(() => ({
        user: state.user,
        profile: state.profile,
        loading: state.loading,
        // Business data is now part of the profile
        business: state.profile ? {
            id: state.profile.id, // Profile ID is the Business ID
            name: state.profile.biz_name,
            category: state.profile.biz_category,
            size: state.profile.biz_size,
            employee_count: state.profile.biz_employee_count,
            currency: state.profile.biz_currency,
            logo_url: state.profile.biz_logo_url,
            phone: state.profile.biz_phone,
            address: state.profile.biz_address
        } : null,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile: () => userRef.current && fetchProfile(userRef.current.id),
    }), [state]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
