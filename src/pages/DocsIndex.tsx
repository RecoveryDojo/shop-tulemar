import { Link } from "react-router-dom";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Video, ClipboardList, Users } from "lucide-react";

const DocsIndex = () => {
  const docSections = [
    {
      title: "User Manuals",
      description: "Comprehensive guides for each role in the system",
      icon: BookOpen,
      links: [
        { name: "Customer Manual", path: "/docs/user-manuals/01-customer-manual.md" },
        { name: "Shopper Manual", path: "/docs/user-manuals/02-shopper-manual.md" },
        { name: "Driver Manual", path: "/docs/user-manuals/03-driver-manual.md" },
        { name: "Concierge Manual", path: "/docs/user-manuals/04-concierge-manual.md" },
        { name: "Store Manager Manual", path: "/docs/user-manuals/05-store-manager-manual.md" },
        { name: "Admin Manual", path: "/docs/user-manuals/06-admin-manual.md" },
      ],
    },
    {
      title: "Visual Guides",
      description: "Step-by-step visual walkthroughs with screenshots",
      icon: FileText,
      links: [
        { name: "Customer Visual Guide", path: "/docs/training-materials/visual-guide-customer.md" },
        { name: "Shopper Visual Guide", path: "/docs/training-materials/visual-guide-shopper.md" },
        { name: "Driver Visual Guide", path: "/docs/training-materials/visual-guide-driver.md" },
        { name: "Concierge Visual Guide", path: "/docs/training-materials/visual-guide-concierge.md" },
        { name: "Store Manager Visual Guide", path: "/docs/training-materials/visual-guide-store-manager.md" },
        { name: "Admin Visual Guide", path: "/docs/training-materials/visual-guide-admin.md" },
      ],
    },
    {
      title: "Training Materials",
      description: "Resources for onboarding and training",
      icon: Users,
      links: [
        { name: "Quick Reference Cards", path: "/docs/training-materials/quick-reference-cards.md" },
        { name: "Training Checklists", path: "/docs/training-materials/training-checklists.md" },
        { name: "Video Tutorial Scripts", path: "/docs/training-materials/video-tutorial-scripts.md" },
      ],
    },
  ];

  return (
    <ShopLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Documentation Center</h1>
            <p className="text-xl text-muted-foreground">
              Complete guides and training materials for all Tulemar Shop roles
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
            {docSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title} className="flex flex-col">
                  <CardHeader>
                    <Icon className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-2">
                      {section.links.map((link) => (
                        <Button
                          key={link.path}
                          variant="ghost"
                          className="w-full justify-start"
                          asChild
                        >
                          <Link to={link.path}>
                            <FileText className="mr-2 h-4 w-4" />
                            {link.name}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
};

export default DocsIndex;
