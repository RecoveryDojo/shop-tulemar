import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Shield, 
  Settings, 
  MessageCircle,
  Bell,
  Save,
  Edit3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  id: string;
  display_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  status?: string;
  contact_hours?: string;
  emergency_contact?: string;
  preferences?: any;
}

interface EmailPreferences {
  email_enabled: boolean;
  message_notifications: boolean;
  order_notifications: boolean;
  system_notifications: boolean;
  emergency_notifications: boolean;
  email_frequency: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export function ProfilePage() {
  const { user, profile, roles } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData>({
    id: user?.id || '',
    display_name: profile?.display_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || '',
    bio: '',
    status: 'available',
    contact_hours: '',
    emergency_contact: '',
    preferences: {}
  });
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({
    email_enabled: true,
    message_notifications: true,
    order_notifications: true,
    system_notifications: true,
    emergency_notifications: true,
    email_frequency: 'immediate',
    quiet_hours_start: '',
    quiet_hours_end: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
    fetchEmailPreferences();
  }, [user?.id]);

  const fetchProfileData = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          id: data.id,
          display_name: data.display_name || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || '',
          status: data.status || 'available',
          contact_hours: data.contact_hours || '',
          emergency_contact: data.emergency_contact || '',
          preferences: data.preferences || {}
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailPreferences = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setEmailPrefs({
          email_enabled: data.email_enabled,
          message_notifications: data.message_notifications,
          order_notifications: data.order_notifications,
          system_notifications: data.system_notifications,
          emergency_notifications: data.emergency_notifications,
          email_frequency: data.email_frequency,
          quiet_hours_start: data.quiet_hours_start || '',
          quiet_hours_end: data.quiet_hours_end || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching email preferences:', error);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name,
          phone: profileData.phone,
          bio: profileData.bio,
          status: profileData.status,
          contact_hours: profileData.contact_hours,
          emergency_contact: profileData.emergency_contact,
          preferences: profileData.preferences
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  const saveEmailPreferences = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          user_id: user.id,
          ...emailPrefs
        });

      if (error) throw error;

      toast({
        title: "Email preferences updated",
        description: "Your notification settings have been saved",
      });
    } catch (error: any) {
      console.error('Error saving email preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save email preferences",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'sysadmin': return 'destructive';
      case 'store_manager': return 'default';
      case 'shopper': return 'secondary';
      case 'driver': return 'outline';
      case 'concierge': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(profileData.status || 'offline')}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {profileData.display_name || 'User Profile'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {roles.map((role) => (
                <Badge key={role} variant={getRoleBadgeColor(role)}>
                  {role.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button 
          onClick={() => isEditing ? saveProfile() : setIsEditing(true)}
          variant={isEditing ? 'default' : 'outline'}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                  <Input
                    value={profileData.display_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Availability & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={profileData.status}
                    onChange={(e) => setProfileData(prev => ({ ...prev, status: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Hours</label>
                  <Input
                    value={profileData.contact_hours}
                    onChange={(e) => setProfileData(prev => ({ ...prev, contact_hours: e.target.value }))}
                    placeholder="e.g., 9 AM - 5 PM"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Emergency Contact</label>
                  <Input
                    value={profileData.emergency_contact}
                    onChange={(e) => setProfileData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                    placeholder="Emergency contact info"
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Email Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable all email notifications
                  </p>
                </div>
                <Switch
                  checked={emailPrefs.email_enabled}
                  onCheckedChange={(checked) => 
                    setEmailPrefs(prev => ({ ...prev, email_enabled: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Message Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <Switch
                    checked={emailPrefs.message_notifications}
                    onCheckedChange={(checked) => 
                      setEmailPrefs(prev => ({ ...prev, message_notifications: checked }))
                    }
                    disabled={!emailPrefs.email_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Order Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Get updates about order status changes
                    </p>
                  </div>
                  <Switch
                    checked={emailPrefs.order_notifications}
                    onCheckedChange={(checked) => 
                      setEmailPrefs(prev => ({ ...prev, order_notifications: checked }))
                    }
                    disabled={!emailPrefs.email_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">System Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Important system updates and announcements
                    </p>
                  </div>
                  <Switch
                    checked={emailPrefs.system_notifications}
                    onCheckedChange={(checked) => 
                      setEmailPrefs(prev => ({ ...prev, system_notifications: checked }))
                    }
                    disabled={!emailPrefs.email_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Emergency Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Critical alerts that require immediate attention
                    </p>
                  </div>
                  <Switch
                    checked={emailPrefs.emergency_notifications}
                    onCheckedChange={(checked) => 
                      setEmailPrefs(prev => ({ ...prev, emergency_notifications: checked }))
                    }
                    disabled={!emailPrefs.email_enabled}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email Frequency</label>
                  <select
                    value={emailPrefs.email_frequency}
                    onChange={(e) => setEmailPrefs(prev => ({ ...prev, email_frequency: e.target.value }))}
                    className="w-full p-2 border rounded-md mt-1"
                    disabled={!emailPrefs.email_enabled}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="hourly">Hourly Digest</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                  </select>
                </div>
              </div>

              <Button onClick={saveEmailPreferences} className="w-full">
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Account Information</h4>
                    <p className="text-sm text-muted-foreground">
                      User ID: {user?.id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Roles & Permissions</h4>
                    <div className="flex items-center space-x-2 mt-2">
                      {roles.map((role) => (
                        <Badge key={role} variant={getRoleBadgeColor(role)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {role.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}