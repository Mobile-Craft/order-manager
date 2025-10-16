import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  Users,
  Plus,
  Mail,
  Menu,
  Crown,
  ShoppingCart,
  ChefHat,
  Trash2,
  Send,
  X,
  Edit,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { theme } from '@/lib/theme';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'Admin' | 'Cajero' | 'Cocina';
  created_at: string;
}

interface BusinessInvitation {
  id: string;
  email: string;
  role: 'Cajero' | 'Cocina';
  created_at: string;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired';
  business_id: string;
  invited_by?: string;
}

export default function UsersScreen() {
  const navigation = useNavigation();
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // Formulario de invitación
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Cajero' | 'Cocina'>('Cajero');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Formulario de edición
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'Cajero' | 'Cocina'>('Cajero');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (user?.business?.id) {
      loadUsers();
      loadInvitations();
    }
  }, [user?.business?.id]);

  const loadUsers = async () => {
    if (!user?.business?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('business_id', user.business.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    }
  };

  const loadInvitations = async () => {
    if (!user?.business?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('business_invitations')
        .select('*')
        .eq('business_id', user.business.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (userProfile: UserProfile) => {
    if (userProfile.role === 'Admin') {
      Alert.alert('Error', 'No se puede editar el rol de un administrador');
      return;
    }
    setEditingUser(userProfile);
    setEditName(userProfile.full_name);
    setEditRole(userProfile.role as 'Cajero' | 'Cocina');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditName('');
    setEditRole('Cajero');
  };

  const updateUser = async () => {
    if (!editingUser) return;
    
    if (!editName.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    try {
      setEditLoading(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editName.trim(),
          role: editRole,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      closeEditModal();
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    } finally {
      setEditLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'El correo electrónico es requerido');
      return;
    }

    if (!inviteEmail.includes('@')) {
      Alert.alert('Error', 'Ingresa un correo electrónico válido');
      return;
    }

    // Verificar si ya existe un usuario con ese email
    const existingUser = users.find(u => u.user_id === inviteEmail);
    if (existingUser) {
      Alert.alert('Error', 'Ya existe un usuario con ese correo electrónico');
      return;
    }

    // Verificar si ya hay una invitación pendiente
    const existingInvitation = invitations.find(i => i.email === inviteEmail.trim().toLowerCase());
    if (existingInvitation) {
      Alert.alert('Error', 'Ya hay una invitación pendiente para este correo');
      return;
    }

    try {
      setInviteLoading(true);
      
      console.log('🔄 Iniciando proceso de invitación...');
      console.log('📧 Email:', inviteEmail.trim().toLowerCase());
      console.log('👤 Rol:', inviteRole);
      console.log('🏢 Business ID:', user?.business?.id);
      console.log('👤 User ID (invited_by):', user?.id);
      
      // Crear la invitación en la base de datos PRIMERO
      console.log('💾 Insertando invitación en base de datos...');
      
      const { data: insertedData, error: invitationError } = await supabase
        .from('business_invitations')
        .insert({
          business_id: user?.business?.id,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          invited_by: user?.id, // Incluir quién hizo la invitación
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        })
        .select();

      if (invitationError) {
        console.error('❌ Error completo al insertar invitación:', {
          code: invitationError.code,
          message: invitationError.message,
          details: invitationError.details,
          hint: invitationError.hint
        });
        throw invitationError;
      }
      
      console.log('✅ Invitación insertada correctamente:', insertedData);

      // Intentar enviar correo usando función edge corregida (ya no crea usuarios)
      // La función edge ahora usa servicios externos en lugar de generateLink
      console.log('📧 Enviando correo de invitación...');
      let emailSent = false;
      
      try {
        // Llamar a función edge corregida (sin creación de usuarios)
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            invitation_id: insertedData[0].id,
            email: inviteEmail.trim().toLowerCase(),
            role: inviteRole,
            business_name: user?.business?.name || 'Order Manager',
            admin_name: user?.profile?.full_name || user?.email?.split('@')[0] || 'Administrador',
            expires_at: insertedData[0].expires_at
          }
        });

        if (emailError) {
          console.warn('⚠️ Error en función edge:', emailError);
          // La función puede fallar si no hay servicio de email configurado
        } else {
          emailSent = true;
          console.log('✅ Correo enviado exitosamente:', emailData);
        }
      } catch (emailError) {
        console.warn('⚠️ Error al llamar función edge:', emailError);
      }

      // Crear mensaje basado en el resultado del envío
      const emailStatusMessage = emailSent 
        ? `📧 Se ha enviado un correo automático con las instrucciones de registro.`
        : `⚠️ No se pudo enviar correo automático (requiere configuración de servicio de email).\n\nPuedes compartir las instrucciones manualmente.`;

      Alert.alert(
        emailSent ? 'Invitación Enviada' : 'Invitación Creada',
        `✅ Se ha creado la invitación para ${inviteEmail} como ${inviteRole}.\n\n` +
        emailStatusMessage +
        (emailSent ? '\n\nSi no recibe el correo, revisa spam.' : ''),
        [
          { text: 'OK' },
          ...(!emailSent ? [{
            text: 'Ver Instrucciones',
            onPress: () => {
              const invitationInstructions = `🎉 INVITACIÓN A ${user?.business?.name?.toUpperCase() || 'ORDER MANAGER'}

Hola,

${user?.profile?.full_name || 'El administrador'} te ha invitado como ${inviteRole}.

📱 PASOS PARA UNIRTE:

1️⃣ Descarga "Expo Go" desde App Store o Google Play
2️⃣ Abre Expo Go y busca "Order Manager"  
3️⃣ Toca "Crear Cuenta"
4️⃣ Usa este email: ${inviteEmail}
5️⃣ Verifica tu email con el código OTP
6️⃣ Completa tu perfil

✨ El sistema detectará automáticamente tu invitación.

⏰ Expira: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-DO')}

🔐 Como ${inviteRole} podrás:
${inviteRole === 'Cajero' ? '• Crear órdenes\n• Procesar pagos\n• Ver estadísticas' : '• Ver órdenes de cocina\n• Marcar como preparadas\n• Gestionar flujo'}

¡Esperamos verte pronto! 🚀`;

              Alert.alert('Instrucciones para Compartir', invitationInstructions, [
                { text: 'Cerrar' }
              ]);
            }
          }] : [])
        ]
      );

      setInviteEmail('');
      setInviteRole('Cajero');
      setShowInviteModal(false);
      loadInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      Alert.alert('Error', 'No se pudo enviar la invitación: ' + (error as any).message);
    } finally {
      setInviteLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    Alert.alert(
      'Cancelar Invitación',
      '¿Estás seguro de que quieres cancelar esta invitación?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('business_invitations')
                .delete()
                .eq('id', invitationId);

              if (error) throw error;
              
              Alert.alert('Éxito', 'Invitación cancelada');
              loadInvitations();
            } catch (error) {
              console.error('Error canceling invitation:', error);
              Alert.alert('Error', 'No se pudo cancelar la invitación');
            }
          }
        }
      ]
    );
  };

  const removeUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar a ${userName} del negocio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', userId);

              if (error) throw error;
              
              Alert.alert('Éxito', 'Usuario eliminado del negocio');
              loadUsers();
            } catch (error) {
              console.error('Error removing user:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return Crown;
      case 'Cajero': return ShoppingCart;
      case 'Cocina': return ChefHat;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#DC2626';
      case 'Cajero': return '#059669';
      case 'Cocina': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Menu size={24} color={theme.colors.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Acceso Denegado</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>
            Solo los administradores pueden gestionar usuarios
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Menu size={24} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Users size={28} color={theme.colors.primaryDark} />
          <Text style={styles.title}>Usuarios</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {users.length} usuarios • {invitations.length} invitaciones pendientes
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.inviteButton} 
        onPress={() => setShowInviteModal(true)}
      >
        <Plus size={20} color="white" />
        <Text style={styles.inviteButtonText}>Invitar Usuario</Text>
      </TouchableOpacity>

      {loading ? (
        <LoadingSpinner message="Cargando usuarios..." />
      ) : (
        <ScrollView style={styles.content}>
          {/* Usuarios Activos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usuarios Activos ({users.length})</Text>
            {users.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No hay usuarios</Text>
              </View>
            ) : (
              users.map((userProfile) => {
                const RoleIcon = getRoleIcon(userProfile.role);
                const roleColor = getRoleColor(userProfile.role);
                const isCurrentUser = userProfile.user_id === user?.id;
                
                return (
                  <View key={userProfile.id} style={styles.userCard}>
                    <View style={styles.userInfo}>
                      <View style={[styles.roleIcon, { backgroundColor: roleColor + '20' }]}>
                        <RoleIcon size={20} color={roleColor} />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>
                          {userProfile.full_name}
                          {isCurrentUser && ' (Tú)'}
                        </Text>
                        <Text style={[styles.userRole, { color: roleColor }]}>
                          {userProfile.role}
                        </Text>
                        <Text style={styles.userDate}>
                          Desde {formatDate(userProfile.created_at)}
                        </Text>
                      </View>
                    </View>
                    
                    {!isCurrentUser && userProfile.role !== 'Admin' && (
                      <View style={styles.userActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => openEditModal(userProfile)}
                        >
                          <Edit size={16} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeUser(userProfile.id, userProfile.full_name)}
                        >
                          <Trash2 size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Invitaciones Pendientes */}
          {invitations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Invitaciones Pendientes ({invitations.length})
              </Text>
              {invitations.map((invitation) => {
                const RoleIcon = getRoleIcon(invitation.role);
                const roleColor = getRoleColor(invitation.role);
                
                return (
                  <View key={invitation.id} style={styles.invitationCard}>
                    <View style={styles.userInfo}>
                      <View style={[styles.roleIcon, { backgroundColor: roleColor + '20' }]}>
                        <Mail size={20} color={roleColor} />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{invitation.email}</Text>
                        <Text style={[styles.userRole, { color: roleColor }]}>
                          {invitation.role}
                        </Text>
                        <Text style={styles.userDate}>
                          Invitado el {formatDate(invitation.created_at)}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => cancelInvitation(invitation.id)}
                    >
                      <X size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal de Invitación */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invitar Usuario</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInviteModal(false)}
            >
              <X size={24} color={theme.colors.primaryDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="usuario@ejemplo.com"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Rol</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    inviteRole === 'Cajero' && styles.roleButtonActive
                  ]}
                  onPress={() => setInviteRole('Cajero')}
                >
                  <ShoppingCart size={20} color={inviteRole === 'Cajero' ? 'white' : '#059669'} />
                  <Text style={[
                    styles.roleButtonText,
                    inviteRole === 'Cajero' && styles.roleButtonTextActive
                  ]}>
                    Cajero
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    inviteRole === 'Cajero' && styles.roleDescriptionActive
                  ]}>
                    Crear órdenes, cobrar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    inviteRole === 'Cocina' && styles.roleButtonActive
                  ]}
                  onPress={() => setInviteRole('Cocina')}
                >
                  <ChefHat size={20} color={inviteRole === 'Cocina' ? 'white' : '#F59E0B'} />
                  <Text style={[
                    styles.roleButtonText,
                    inviteRole === 'Cocina' && styles.roleButtonTextActive
                  ]}>
                    Cocina
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    inviteRole === 'Cocina' && styles.roleDescriptionActive
                  ]}>
                    Preparar órdenes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inviteEmail.trim() || inviteLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendInvitation}
              disabled={!inviteEmail.trim() || inviteLoading}
            >
              <Send size={20} color="white" />
              <Text style={styles.sendButtonText}>
                {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de Edición de Usuario */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Usuario</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeEditModal}
            >
              <X size={24} color={theme.colors.primaryDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre Completo</Text>
              <View style={styles.inputContainer}>
                <Users size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  value={editName}
                  onChangeText={setEditName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Rol</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    editRole === 'Cajero' && styles.roleButtonActive
                  ]}
                  onPress={() => setEditRole('Cajero')}
                >
                  <ShoppingCart size={20} color={editRole === 'Cajero' ? 'white' : '#059669'} />
                  <Text style={[
                    styles.roleButtonText,
                    editRole === 'Cajero' && styles.roleButtonTextActive
                  ]}>
                    Cajero
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    editRole === 'Cajero' && styles.roleDescriptionActive
                  ]}>
                    Crear órdenes, cobrar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    editRole === 'Cocina' && styles.roleButtonActive
                  ]}
                  onPress={() => setEditRole('Cocina')}
                >
                  <ChefHat size={20} color={editRole === 'Cocina' ? 'white' : '#F59E0B'} />
                  <Text style={[
                    styles.roleButtonText,
                    editRole === 'Cocina' && styles.roleButtonTextActive
                  ]}>
                    Cocina
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    editRole === 'Cocina' && styles.roleDescriptionActive
                  ]}>
                    Preparar órdenes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={closeEditModal}
            >
              <Text style={styles.cancelModalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!editName.trim() || editLoading) && styles.sendButtonDisabled
              ]}
              onPress={updateUser}
              disabled={!editName.trim() || editLoading}
            >
              <Edit size={20} color="white" />
              <Text style={styles.sendButtonText}>
                {editLoading ? 'Actualizando...' : 'Actualizar Usuario'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  placeholder: {
    width: 40,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#059669',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    textAlign: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark,
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  invitationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  copyPasswordButton: {
    padding: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  roleButtons: {
    gap: 12,
  },
  roleButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryDark,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  roleButtonTextActive: {
    color: 'white',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  roleDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
});