import React, { useState, useRef } from'react';
import { useSelector } from'react-redux';
import type { RootState } from'../store';
import { updateUserProfile, uploadProfilePhoto } from'../services/profileService';
import { Camera, Save, Loader2 } from'lucide-react';

export default function Settings() {
 const user = useSelector((state: RootState) => state.auth.user);
 const [name, setName] = useState(user?.name ||'');
 const [role, setRole] = useState(user?.role ||'');
 const [isSaving, setIsSaving] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [feedback, setFeedback] = useState<{ type:'success' |'error'; message: string } | null>(null);
 
 const fileInputRef = useRef<HTMLInputElement>(null);

 if (!user || !user.uid) {
 return <div className="p-8 text-center">Carregando perfil...</div>;
 }

 const handleSaveProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim() || !role.trim()) {
 setFeedback({ type:'error', message:'Nome e Cargo são obrigatórios.' });
 return;
 }
 
 if (!user.uid) return;

 try {
 setIsSaving(true);
 setFeedback(null);
 await updateUserProfile(user.uid, { name, role });
 setFeedback({ type:'success', message:'Perfil atualizado com sucesso!' });
 } catch (error) {
 console.error(error);
 setFeedback({ type:'error', message:'Erro ao atualizar o perfil. Tente novamente.' });
 } finally {
 setIsSaving(false);
 setTimeout(() => setFeedback(null), 3000);
 }
 };

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file || !user.uid) return;

 try {
 setIsUploading(true);
 setFeedback(null);
 await uploadProfilePhoto(user.uid, file);
 setFeedback({ type:'success', message:'Foto atualizada com sucesso!' });
 } catch (error) {
 console.error(error);
 setFeedback({ type:'error', message:'Erro ao enviar a foto. Tente novamente.' });
 } finally {
 setIsUploading(false);
 if (fileInputRef.current) {
 fileInputRef.current.value ='';
 }
 setTimeout(() => setFeedback(null), 3000);
 }
 };

 const initials = name ? name.split('').map(n => n[0]).join('').substring(0, 2).toUpperCase() :'U';

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 <h1 className="text-2xl font-bold text-text-primary">Configurações de Perfil</h1>
 
 <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 md:p-8">
 <div className="flex flex-col md:flex-row gap-8 items-start">
 
 {/* Avatar Section */}
 <div className="flex flex-col items-center gap-4">
 <div className="relative group">
 <div 
 className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center text-4xl font-bold text-[var(--primary-foreground)] shadow-md transition-all duration-300 ring-4 ring-background"
 style={{ backgroundColor: user.photoURL ?'transparent' : (user.avatarColor ||'#3b82f6') }}
 >
 {user.photoURL ? (
 <img src={user.photoURL} alt="Avatar"className="w-full h-full object-cover"/>
 ) : (
 <span>{initials}</span>
 )}
 
 <div 
 className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
 onClick={() => fileInputRef.current?.click()}
 >
 <Camera className="text-[var(--primary-foreground)] w-8 h-8"/>
 </div>
 </div>

 {isUploading && (
 <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
 <Loader2 className="w-8 h-8 text-[var(--primary-foreground)] animate-spin"/>
 </div>
 )}
 </div>

 <button 
 onClick={() => fileInputRef.current?.click()}
 disabled={isUploading}
 className="text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
 >
 Alterar foto
 </button>
 <input 
 type="file"
 ref={fileInputRef}
 onChange={handleFileChange}
 accept="image/*"
 className="hidden"
 />
 </div>

 {/* Form Section */}
 <div className="flex-1 w-full">
 <form onSubmit={handleSaveProfile} className="space-y-5">
 
 {feedback && (
 <div className={`p-3 rounded-lg text-sm font-medium ${feedback.type ==='success' ?'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
 {feedback.message}
 </div>
 )}

 <div>
 <label className="block text-sm font-medium text-text-secondary mb-1">
 Nome Completo
 </label>
 <input 
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full px-4 py-2 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
 placeholder="Seu nome completo"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-text-secondary mb-1">
 Cargo
 </label>
 <input 
 type="text"
 value={role}
 onChange={(e) => setRole(e.target.value)}
 className="w-full px-4 py-2 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
 placeholder="Seu cargo na empresa"
 />
 </div>

 <div className="pt-4 border-t border-border flex justify-end">
 <button
 type="submit"
 disabled={isSaving}
 className="flex items-center gap-2 px-6 py-2.5 bg-primary text-[var(--primary-foreground)] font-semibold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-70"
 >
 {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
 Salvar Alterações
 </button>
 </div>
 </form>
 </div>

 </div>
 </div>
 </div>
 );
}
