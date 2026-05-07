import { useRef, useState } from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';

interface AvatarPickerProps {
    userId: string;
    name: string;
    size?: 'sm' | 'lg';
    onAvatarChange?: (url: string | null) => void;
}

function getStorageKey(userId: string) { return `dp_${userId}`; }

export function getAvatar(userId: string): string | null {
    const cached = localStorage.getItem(getStorageKey(userId));
    if (cached) return cached;
    // Default image for Saad Mansuri (ID '2')
    if (userId === '2') return '/saad_profile.jpg';
    return null;
}

export default function AvatarPicker({ userId, name, size = 'lg', onAvatarChange }: AvatarPickerProps) {
    const [avatar, setAvatar] = useState<string | null>(getAvatar(userId));
    const [hover, setHover] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const dim = size === 'lg' ? 'w-28 h-28' : 'w-12 h-12';
    const textSize = size === 'lg' ? 'text-4xl' : 'text-lg';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            const dataUrl = e.target?.result as string;
            localStorage.setItem(getStorageKey(userId), dataUrl);
            setAvatar(dataUrl);
            onAvatarChange?.(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    const removeAvatar = (ev: React.MouseEvent) => {
        ev.stopPropagation();
        localStorage.removeItem(getStorageKey(userId));
        setAvatar(null);
        onAvatarChange?.(null);
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Avatar circle */}
            <div
                className={`relative ${dim} rounded-full cursor-pointer select-none ring-4 ring-white shadow-lg`}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={() => inputRef.current?.click()}
            >
                {avatar ? (
                    <img
                        src={avatar}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    <div className={`w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ${textSize} font-bold text-white`}>
                        {initials}
                    </div>
                )}

                {/* Hover overlay */}
                {hover && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-all">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
            />

            {/* Buttons */}
            {size === 'lg' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition font-medium"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        {avatar ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {avatar && (
                        <button
                            onClick={removeAvatar}
                            className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition font-medium"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                        </button>
                    )}
                </div>
            )}
            {size === 'lg' && (
                <p className="text-xs text-gray-400">Click the photo or use the button to upload (JPG, PNG)</p>
            )}
        </div>
    );
}
