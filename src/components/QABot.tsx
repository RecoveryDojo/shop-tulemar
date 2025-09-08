import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Bot, User, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface QAMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  links?: { text: string; url: string }[];
}

const qaKnowledgeBase = {
  'shop': {
    keywords: ['shop', 'store', 'buy', 'purchase', 'products'],
    response: "Welcome to Tulemar Shop! You can browse our 8 categories of Costa Rican products, add items to your cart, and place orders for delivery to your vacation rental.",
    links: [
      { text: 'Browse Categories', url: '/shop/categories' },
      { text: 'View Cart', url: '/shop/cart' },
      { text: 'How It Works', url: '/shop/how-it-works' }
    ]
  },
  'categories': {
    keywords: ['categories', 'category', 'dairy', 'eggs', 'fresh produce', 'coffee', 'seafood', 'meat', 'bakery', 'wine', 'baby', 'organic'],
    response: "We have 9 product categories: Dairy & Eggs, Fresh Produce, Coffee & Beverages, Fresh Seafood, Meat & Poultry, Bakery & Grains, Wines & Spirits, Baby & Family, and Organic & Health. Each category has carefully selected Costa Rican products.",
    links: [{ text: 'View All Categories', url: '/shop/categories' }]
  },
  'cart': {
    keywords: ['cart', 'shopping cart', 'checkout', 'total', 'delivery'],
    response: "Your shopping cart shows all selected items with quantities, calculates totals including 13% IVA tax and $5 delivery fee. You can modify quantities or remove items before checkout.",
    links: [{ text: 'View Cart', url: '/shop/cart' }]
  },
  'delivery': {
    keywords: ['delivery', 'shipping', 'when', 'how long', 'time'],
    response: "We offer same-day delivery (2-4 hours) to your vacation rental in the Tulemar area. Orders include temperature-controlled transport for fresh items and optional unpacking service.",
    links: [{ text: 'Learn More', url: '/shop/how-it-works' }]
  },
  'pricing': {
    keywords: ['price', 'cost', 'expensive', 'cheap', 'usd', 'dollar'],
    response: "All prices are in USD. Fresh produce ranges $1-8, beverages $2-15, seafood $8-25/lb, meat $6-20/lb. We include 13% Costa Rica IVA tax and $5 delivery fee. Free delivery on orders over $50!",
    links: [{ text: 'Browse Products', url: '/shop/categories' }]
  },
  'products': {
    keywords: ['mango', 'coffee', 'fish', 'beef', 'bread', 'wine', 'organic', 'local', 'costa rica'],
    response: "We feature authentic Costa Rican products: Tommy Atkins mangoes from Guanacaste, Tarrazú coffee, fresh Pacific seafood, grass-fed highland beef, traditional gallo pinto ingredients, and more!",
    links: [{ text: 'Browse All Products', url: '/shop/categories' }]
  },
  'help': {
    keywords: ['help', 'support', 'contact', 'question', 'problem'],
    response: "Need assistance? You can contact our support team, start a custom order, or browse our how-it-works guide. We're here to make your Costa Rican vacation dining experience perfect!",
    links: [
      { text: 'Contact Support', url: '/contact' },
      { text: 'Custom Order', url: '/shop/order' },
      { text: 'How It Works', url: '/shop/how-it-works' }
    ]
  },
  'test': {
    keywords: ['test', 'qa', 'check', 'working', 'functionality'],
    response: "To test the site: 1) Browse categories and products 2) Add items to cart 3) View cart and modify quantities 4) Test search functionality 5) Navigate between pages 6) Check responsive design 7) Test contact forms",
    suggestions: ['Test product search', 'Add items to cart', 'Test navigation', 'Check mobile view']
  }
};

const quickSuggestions = [
  'How does delivery work?',
  'What categories do you have?',
  'How to add items to cart?',
  'What are the prices?',
  'Tell me about Costa Rican products',
  'Test site functionality'
];

export function QABot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<QAMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Hi! I'm your Tulemar Shop QA assistant. I can help you navigate the site, answer questions about our products and services, or guide you through testing functionality. What would you like to know?",
      timestamp: new Date(),
      suggestions: quickSuggestions
    }
  ]);
  const [input, setInput] = useState('');
  const { toast } = useToast();

  const findBestResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    for (const [key, data] of Object.entries(qaKnowledgeBase)) {
      if (data.keywords.some(keyword => input.includes(keyword))) {
        return {
          response: data.response,
          suggestions: 'suggestions' in data ? data.suggestions : undefined,
          links: 'links' in data ? data.links : undefined
        };
      }
    }
    
    return {
      response: "I understand you're asking about the Tulemar Shop. Here are some common topics I can help with:",
      suggestions: quickSuggestions,
      links: [{ text: 'Browse Shop', url: '/shop' }]
    };
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: QAMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    const response = findBestResponse(input);
    const botMessage: QAMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response.response,
      timestamp: new Date(),
      suggestions: response.suggestions,
      links: response.links
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInput('');
    
    toast({
      title: "QA Bot Response",
      description: "I've provided information based on your question.",
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-gradient-tropical hover:opacity-90 text-white border-0"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          QA Bot
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Bot className="h-5 w-5 text-primary" />
            Tulemar Shop QA Assistant
            <Badge variant="outline" className="ml-auto">
              Live
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  
                  <Card className={`${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <CardContent className="p-3">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {message.links && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.links.map((link, index) => (
                            <Link key={index} to={link.url} onClick={() => setIsOpen(false)}>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {link.text}
                              </Button>
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about Tulemar Shop..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={sendMessage} size="sm" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            💡 Try asking about delivery, products, categories, or testing functionality
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}