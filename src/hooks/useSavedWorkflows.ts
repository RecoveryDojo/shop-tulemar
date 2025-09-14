import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SavedWorkflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  workflow_data: any;
  visual_config: any;
  order_count: number;
  phase_distribution: any;
  metadata: any;
  tags: string[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export const useSavedWorkflows = () => {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
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

  const saveWorkflow = async (workflowData: {
    name: string;
    description?: string;
    workflow_data: any;
    visual_config?: any;
    order_count?: number;
    phase_distribution?: any;
    metadata?: any;
    tags?: string[];
    is_template?: boolean;
  }) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('saved_workflows')
        .insert([{ ...workflowData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workflow saved successfully",
      });

      fetchWorkflows();
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });

      fetchWorkflows();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return {
    workflows,
    loading,
    saveWorkflow,
    deleteWorkflow,
    refreshWorkflows: fetchWorkflows,
  };
};