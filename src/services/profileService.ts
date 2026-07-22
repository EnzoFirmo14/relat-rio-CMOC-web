import { doc, getDoc, setDoc, updateDoc, onSnapshot } from'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from'firebase/storage';
import { db, storage } from'./firebase';

export interface UserProfile {
 uid: string;
 email: string | null;
 name: string;
 role: string;
 photoURL?: string;
 avatarColor: string;
 createdAt?: string;
 updatedAt?: string;
}

// Generate a deterministic color based on string
const stringToColor = (string: string) => {
 let hash = 0;
 for (let i = 0; i < string.length; i += 1) {
 hash = string.charCodeAt(i) + ((hash << 5) - hash);
 }
 let color ='#';
 for (let i = 0; i < 3; i += 1) {
 const value = (hash >> (i * 8)) & 0xff;
 color += `00${value.toString(16)}`.slice(-2);
 }
 return color;
};

export const getOrCreateUserProfile = async (
 uid: string, 
 email: string | null, 
 defaultName: string ='Usuário Autenticado',
 defaultRole: string ='Operador'
): Promise<UserProfile> => {
 const userDocRef = doc(db,'usuarios', uid);
 const userDoc = await getDoc(userDocRef);

 if (userDoc.exists()) {
 return userDoc.data() as UserProfile;
 } else {
 // Create new profile
 const newProfile: UserProfile = {
 uid,
 email,
 name: defaultName,
 role: defaultRole,
 avatarColor: stringToColor(email || uid),
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 };
 
 await setDoc(userDocRef, newProfile);
 return newProfile;
 }
};

export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
 const userDocRef = doc(db,'usuarios', uid);
 
 return onSnapshot(userDocRef, (doc) => {
 if (doc.exists()) {
 callback(doc.data() as UserProfile);
 } else {
 callback(null);
 }
 });
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
 const userDocRef = doc(db,'usuarios', uid);
 await updateDoc(userDocRef, {
 ...data,
 updatedAt: new Date().toISOString()
 });
};

export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
 const fileExtension = file.name.split('.').pop();
 const storageRef = ref(storage, `avatars/${uid}.${fileExtension}`);
 
 const snapshot = await uploadBytes(storageRef, file);
 const downloadURL = await getDownloadURL(snapshot.ref);
 
 await updateUserProfile(uid, { photoURL: downloadURL });
 
 return downloadURL;
};
