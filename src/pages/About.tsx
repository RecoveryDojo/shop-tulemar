import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Heart, Leaf, Users, Award, MapPin, Clock } from "lucide-react";
import chefImage from "@/assets/chef-1.jpg";

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Passion for Hospitality",
      description: "We believe food is love, and we pour our hearts into every meal we prepare for your vacation."
    },
    {
      icon: Leaf,
      title: "Sustainability",
      description: "Supporting local farmers and using sustainable practices to protect Costa Rica's beautiful environment."
    },
    {
      icon: Users,
      title: "Community First",
      description: "We work with local suppliers, farmers, and artisans to strengthen our community and share authentic flavors."
    },
    {
      icon: Award,
      title: "Quality Excellence",
      description: "Every ingredient is carefully selected and every dish is prepared to the highest culinary standards."
    }
  ];

  const team = [
    {
      name: "Maria Rodriguez",
      title: "Head Chef & Co-Founder",
      bio: "With 20 years of culinary experience in Costa Rica's finest restaurants, Maria brings authentic traditional flavors to modern presentations.",
      specialties: ["Traditional Costa Rican Cuisine", "Farm-to-Table Cooking", "Dietary Accommodations"]
    },
    {
      name: "Carlos Mendez",
      title: "Operations Director",
      bio: "Former hospitality manager with deep knowledge of Costa Rica's tourism industry and local supply chains.",
      specialties: ["Logistics Coordination", "Local Sourcing", "Guest Services"]
    },
    {
      name: "Sofia Vargas",
      title: "Sous Chef",
      bio: "Trained in international cuisine but passionate about showcasing Costa Rica's incredible biodiversity through food.",
      specialties: ["Seafood Preparation", "Tropical Fruits", "Vegetarian Cuisine"]
    },
    {
      name: "Diego Jimenez",
      title: "Delivery Coordinator",
      bio: "Local expert who ensures your meals arrive fresh and perfectly organized in your vacation accommodation.",
      specialties: ["Quality Control", "Delivery Logistics", "Customer Coordination"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Our Story
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Born from a love of Costa Rican culture and a desire to share authentic flavors with the world
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Vacation Meals Costa Rica was born from a simple observation: travelers come to Costa Rica 
                for adventure and relaxation, but often spend precious vacation time figuring out meals or 
                settling for tourist food that doesn't represent our incredible culinary heritage.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We bridge that gap by bringing authentic, restaurant-quality Costa Rican cuisine directly 
                to your vacation rental, prepared by local chefs who understand both tradition and the 
                needs of international travelers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" asChild>
                  <Link to="/menu">Taste Our Cuisine</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">Meet Our Team</Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img
                src={chefImage}
                alt="Costa Rican chef preparing traditional cuisine"
                className="w-full h-96 object-cover rounded-2xl shadow-elegant"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-lg font-semibold">Chef Maria Rodriguez</p>
                <p className="text-white/90">Head Chef & Co-Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-tropical transition-all duration-300 border-0 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="bg-gradient-tropical p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The passionate people behind your authentic Costa Rican culinary experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-br from-primary/20 to-secondary/20 w-16 h-16 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{member.name}</CardTitle>
                      <p className="text-primary font-medium">{member.title}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{member.bio}</p>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Specialties:</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.specialties.map((specialty, specialtyIndex) => (
                        <span
                          key={specialtyIndex}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Local Impact Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Supporting Local Costa Rica
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every meal you order helps support local farmers, suppliers, and communities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="bg-gradient-tropical p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Local Sourcing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We partner with over 20 local farms and suppliers, ensuring fresh ingredients 
                  while supporting Costa Rican agriculture.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-gradient-sunset p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Local Employment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our team is 100% Costa Rican, providing good jobs and supporting local families 
                  in the tourism industry.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-gradient-ocean p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Sustainability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use eco-friendly packaging and support sustainable farming practices 
                  that protect Costa Rica's incredible biodiversity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-tropical">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Support Local & Taste Authentic?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join us in celebrating Costa Rican culture through food while supporting local communities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="xl" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link to="/order">Place Your Order</Link>
            </Button>
            <Button variant="ghost" size="xl" className="text-white border-white/30 hover:bg-white/10" asChild>
              <Link to="/contact">Get In Touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;