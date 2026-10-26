package dev.hieu.vocabulary.config;

/**
 * Quản lý profile người dùng hiện tại (hieu hoặc dtan) trong luồng xử lý request.
 */
public class ProfileContextHolder {

    private static final ThreadLocal<String> CURRENT_PROFILE = ThreadLocal.withInitial(() -> "hieu");

    public static void setProfile(String profile) {
        if (profile != null && !profile.trim().isEmpty()) {
            CURRENT_PROFILE.set(profile.trim().toLowerCase());
        } else {
            CURRENT_PROFILE.set("hieu");
        }
    }

    public static String getProfile() {
        String profile = CURRENT_PROFILE.get();
        return (profile != null && !profile.trim().isEmpty()) ? profile : "hieu";
    }

    public static String getCurrentProfile() {
        return getProfile();
    }

    public static void clear() {
        CURRENT_PROFILE.remove();
    }
}
