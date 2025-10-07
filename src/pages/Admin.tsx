// sync to GitHub
import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Package, ShoppingCart, UserPlus, UserMinus, Info, ChefHat } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import ProductManager from '@/components/admin/ProductManager';
import { StaffAssignmentTool } from '@/components/admin/StaffAssignmentTool';
import { AdminImpersonation } from '@/components/admin/AdminImpersonation';
import { SimpleRegressionTest } from '@/components/testing/SimpleRegressionTest';
import { OrderConfirmationPanel } from '@/components/workflow/OrderConfirmationPanel';
import { SubstitutionApprovalPanel } from '@/components/workflow/SubstitutionApprovalPanel';

interface UserWithRoles {
  id: string;
  email: string;
  display_name: string | null;
  roles: UserRole[];
}

const Admin = () => {
  const { assignRole, removeRole } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [isCreatingJessica, setIsCreatingJessica] = useState(false);

  const roles: UserRole[] = ['admin', 'driver', 'client', 'concierge', 'sysadmin'];

  const handleCreateJessicaAccount = async () => {
    setIsCreatingJessica(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-jessica-account', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.alreadyExists) {
        toast({
          title: "Account Status",
          description: "Jessica's account already exists!",
        });
      } else {
        toast({
          title: "Account Created",
          description: `Jessica's account created! Temp password: ${data.tempPassword}`,
        });
      }
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Failed to create Jessica\'s account:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create account',
        variant: "destructive",
      });
    } finally {
      setIsCreatingJessica(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name');

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles.map(profile => ({
        ...profile,
        roles: userRoles
          .filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role as UserRole)
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignRole = async (userId: string, role: UserRole) => {
    const { error } = await assignRole(userId, role);
    if (!error) {
      fetchUsers(); // Refresh the list
    }
  };

  const handleRemoveRole = async (userId: string, role: UserRole) => {
    const { error } = await removeRole(userId, role);
    if (!error) {
      fetchUsers(); // Refresh the list
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
      case 'sysadmin':
        return 'destructive';
      case 'concierge':
        return 'secondary';
      case 'driver':
        return 'default';
      case 'client':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'sysadmin']}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage users, roles, AI-powered inventory management, and system settings
          </p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Order Notifications</TabsTrigger>
            <TabsTrigger value="confirmation">Order Confirmation</TabsTrigger>
            <TabsTrigger value="substitutions">Substitution Approval</TabsTrigger>
            <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
            <TabsTrigger value="override">Emergency Override</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
            <TabsTrigger value="ai-learning">AI Learning System</TabsTrigger>
            <TabsTrigger value="documentation">Import Guidelines</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="regression">Simple Regression Test</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Order notifications simplified for beta. Use Order Confirmation panel instead.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmation">
            <OrderConfirmationPanel />
          </TabsContent>

          <TabsContent value="substitutions">
            <SubstitutionApprovalPanel />
          </TabsContent>

          <TabsContent value="staff">
            <StaffAssignmentTool />
          </TabsContent>

          <TabsContent value="override">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Override</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Manual overrides removed for beta. Use RPCs for status transitions.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <ProductManager />
          </TabsContent>

          <TabsContent value="ai-learning">
            <Card>
              <CardHeader>
                <CardTitle>AI Learning System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">AI learning features deferred to post-beta.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentation">
            <Card>
              <CardHeader>
                <CardTitle>Import Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Product documentation deferred to post-beta.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.roles.includes('admin') || u.roles.includes('sysadmin')).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drivers</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.roles.includes('driver')).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.roles.includes('client')).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Administrative shortcuts and emergency fixes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button 
                onClick={handleCreateJessicaAccount}
                disabled={isCreatingJessica}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isCreatingJessica ? 'Creating...' : 'Create Jessica\'s Account'}
              </Button>
              <Button 
                onClick={fetchUsers}
                variant="outline"
                disabled={loading}
              >
                <Users className="mr-2 h-4 w-4" />
                {loading ? 'Refreshing...' : 'Refresh Users'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Assign and remove roles for existing users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.display_name || 'Unnamed User'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">
                              {role}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => handleRemoveRole(user.id, role)}
                              >
                                ×
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex gap-2">
                           <Select onValueChange={(role) => handleAssignRole(user.id, role as UserRole)}>
                             <SelectTrigger className="w-32">
                               <SelectValue placeholder="Add role" />
                             </SelectTrigger>
                             <SelectContent>
                               {roles
                                 .filter(role => !user.roles.includes(role))
                                 .map((role) => (
                                   <SelectItem key={role} value={role}>
                                     {role}
                                   </SelectItem>
                                 ))}
                             </SelectContent>
                           </Select>
                           <AdminImpersonation 
                             userId={user.id}
                             userEmail={user.email}
                             userName={user.display_name || user.email}
                           />
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="regression">
            <SimpleRegressionTest />
          </TabsContent>
        </Tabs>
        </div>
    </ProtectedRoute>
  );
};

export default Admin;