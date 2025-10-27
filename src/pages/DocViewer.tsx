import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FileText, ArrowLeft } from "lucide-react";

const DocViewer = () => {
  const { "*": docPath } = useParams();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoc = async () => {
      if (!docPath) {
        setError("No document path provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Import the markdown file dynamically
        const response = await fetch(`/docs/${docPath}`);
        
        if (!response.ok) {
          throw new Error("Document not found");
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error("Error loading document:", err);
        setError("Failed to load document. Please check the path.");
      } finally {
        setLoading(false);
      }
    };

    loadDoc();
  }, [docPath]);

  if (loading) {
    return (
      <ShopLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading documentation..." />
        </div>
      </ShopLayout>
    );
  }

  if (error) {
    return (
      <ShopLayout>
        <div className="container mx-auto py-12 px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Document Not Found</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button asChild>
                  <Link to="/docs">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Documentation
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" className="mb-6" asChild>
            <Link to="/docs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documentation
            </Link>
          </Button>
          
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ShopLayout>
  );
};

export default DocViewer;
