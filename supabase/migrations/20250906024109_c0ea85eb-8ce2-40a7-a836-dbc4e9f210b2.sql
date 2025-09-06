-- Insert Enhanced AI Learning System features and documentation

-- First, add the main Enhanced AI Learning System feature
INSERT INTO features (
  project_id, 
  name, 
  description, 
  priority, 
  estimated_hours, 
  actual_hours, 
  completion_percentage,
  order_index
) VALUES 
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Enhanced AI Learning & Data Enrichment System',
  'Complete AI-powered product data processing system with machine learning, external data enrichment, quality scoring, and intelligent pattern recognition for automated inventory management.',
  'high',
  120,
  45,
  100,
  1
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'AI Pattern Recognition Engine',
  'Advanced pattern matching system with 13 different AI pattern types for product categorization, unit extraction, brand detection, and data normalization.',
  'high',
  35,
  35,
  100,
  2
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'External Data Source Integration',
  'Integration with external APIs including Open Food Facts, image search services, and other product databases for automated data enrichment.',
  'medium',
  25,
  15,
  100,
  3
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Multi-Stage AI Processing Pipeline',
  'Three-stage processing system: cleanup/normalization, external enrichment, and quality validation with configurable processing stages.',
  'high',
  30,
  20,
  100,
  4
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'AI Quality Scoring & Validation',
  'Automated quality assessment system that scores products based on completeness, accuracy, and data enrichment levels.',
  'medium',
  15,
  10,
  100,
  5
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Enhanced Admin AI Management Interface',
  'Comprehensive admin interface for managing AI patterns, external data sources, processing audit logs, and system configuration.',
  'medium',
  25,
  20,
  100,
  6
);

-- Add comprehensive documentation entries
INSERT INTO documentation (
  project_id,
  title,
  description,
  type,
  status,
  priority,
  tags,
  notes
) VALUES 
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Enhanced AI Learning System - Core Architecture',
  'Complete technical documentation of the Enhanced AI Learning & Data Enrichment System including database schema, edge functions, and React components.',
  'feature',
  'completed',
  'high',
  ARRAY['ai', 'machine-learning', 'data-processing', 'architecture'],
  'System includes: ai_learning_patterns table, ai_pattern_types (13 types), external_data_sources, ai_processing_audit, ai_processing_feedback tables. Edge function: ai-enhanced-processor with OpenAI GPT-5 integration.'
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'AI Pattern Types - Complete Reference',
  'Documentation of all 13 AI pattern types: category, unit, brand, price_format, description_generation, product_classification, nutrition_extraction, allergen_detection, image_optimization, quality_assessment, duplicate_detection, seasonal_availability, external_enrichment.',
  'feature',
  'completed',
  'high',
  ARRAY['ai', 'patterns', 'classification', 'reference'],
  'Each pattern type supports machine learning with confidence scoring, success/failure tracking, and validation status. Patterns learn from user corrections and improve over time.'
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'External Data Sources Integration',
  'Integration capabilities with external APIs for product data enrichment including Open Food Facts for nutrition data, image search APIs, and extensible framework for additional sources.',
  'feature',
  'completed',
  'medium',
  ARRAY['integration', 'external-apis', 'data-enrichment'],
  'Currently supports Open Food Facts for nutrition/allergen data and placeholder for image search. Rate limiting, reliability scoring, and failure tracking implemented.'
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Multi-Stage Processing Pipeline',
  'Three-stage configurable processing: 1) Basic AI cleanup/normalization, 2) External data enrichment, 3) Quality validation and scoring. Each stage can be enabled/disabled independently.',
  'feature',
  'completed',
  'high',
  ARRAY['pipeline', 'processing', 'ai', 'workflow'],
  'Stage 1: OpenAI-powered cleanup using GPT-5 model. Stage 2: External API lookups with caching. Stage 3: Quality scoring based on completeness metrics.'
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'AI Processing Audit & Feedback System',
  'Comprehensive logging and feedback system tracking all AI processing steps, user corrections, confidence scores, and processing metrics for continuous improvement.',
  'feature',
  'completed',
  'medium',
  ARRAY['audit', 'feedback', 'monitoring', 'improvement'],
  'Tracks: processing stages, pattern types, input/output data, success/failure rates, processing times, user feedback for pattern learning.'
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Enhanced Bulk Inventory Manager',
  'Updated bulk inventory management system integrated with enhanced AI processor, supporting Excel file upload, embedded image extraction, and advanced AI processing options.',
  'update',
  'completed',
  'high',
  ARRAY['inventory', 'bulk-import', 'excel', 'ai-integration'],
  'Enhanced with: toggleable external enrichment, processing stage selection, improved error handling, integration with new ai-enhanced-processor edge function.'
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Admin AI Management Dashboard',
  'New admin interface component for managing AI learning patterns, external data sources, processing audit logs, and system analytics with real-time statistics.',
  'feature',
  'completed',
  'medium',
  ARRAY['admin', 'dashboard', 'ai-management', 'analytics'],
  'Features: pattern type management, data source configuration, audit log viewing, system statistics, quality metrics visualization.'
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Database Schema - AI Learning Extensions',
  'Complete database schema extensions for AI learning system including tables: ai_pattern_types, external_data_sources, ai_processing_audit, ai_processing_feedback, and enhanced ai_learning_patterns.',
  'build',
  'completed',
  'high',
  ARRAY['database', 'schema', 'ai', 'extensions'],
  'All tables include proper RLS policies, foreign keys, indexes, and triggers. Supports admin-only access patterns with system insertion capabilities for audit logs.'
);