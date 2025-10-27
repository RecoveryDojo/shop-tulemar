# Shopper Visual Step-by-Step Guide
## Tulemar Shop - Complete Shopper Dashboard Walkthrough

---

## 📱 Dashboard Overview

### Shopper Dashboard Layout
```
┌──────────────────────────────────────────────────────────┐
│  Tulemar Shop Shopper Dashboard            [User Menu ▼]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┬─────────────┬─────────────┐           │
│  │  Today's    │   Avg Find  │  Your Rating│           │
│  │  Orders: 5  │   Rate: 96% │  ⭐ 4.8/5   │           │
│  └─────────────┴─────────────┴─────────────┘           │
│                                                          │
│  📋 AVAILABLE ORDERS                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Order #12345              $234.50    [View Details]│ │
│  │ • 23 items                                         │ │
│  │ • Customer: Villa 45                               │ │
│  │ • Delivery by: 2:00 PM                            │ │
│  │ • Est. shopping time: 45 min                      │ │
│  │                                                    │ │
│  │              [Accept Order]                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  🛒 YOUR ACTIVE ORDERS (1)                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Order #12344    Shopping    [Continue]             │ │
│  │ • Progress: 15/20 items found                      │ │
│  │ • Time elapsed: 32 minutes                         │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Key Dashboard Sections:**
1. **Performance Stats** (Top cards)
2. **Available Orders** (Orders you can accept)
3. **Active Orders** (Orders you're currently shopping)
4. **Order History** (Completed orders)

---

## 🎯 Step 1: Accepting an Order

### Visual Order Card Breakdown:

```
┌─────────────────────────────────────────────────────┐
│  Order #12345                    Assigned: 10:30 AM │
├─────────────────────────────────────────────────────┤
│                                                     │
│  💰 Order Value: $234.50                           │
│  📦 Items: 23 items                                │
│  📍 Delivery: Villa 45, Tulemar Resort             │
│  ⏰ Due: Today 2:00 PM                             │
│  ⏱️ Est. Time: 45 minutes                          │
│  👤 Customer: John Smith                           │
│  🎯 Priority: Standard                             │
│                                                     │
│  Customer Notes:                                    │
│  "Please choose ripe bananas and furthest          │
│   expiration dates on dairy. Gate code: 1234"      │
│                                                     │
│  ┌───────────────┐  ┌──────────────────┐          │
│  │[View Details] │  │ [Accept Order]   │ ← Click  │
│  └───────────────┘  └──────────────────┘          │
└─────────────────────────────────────────────────────┘
```

### Decision Flow:

```
See Available Order
       ↓
Click [View Details]
       ↓
Review:
• Item count
• Order value  
• Delivery deadline
• Customer notes
• Estimated time
       ↓
Decision Point:
┌─────────────────────┐
│ Can I complete this │
│ before deadline?    │
└─────────────────────┘
       ↓
  Yes        No
   ↓          ↓
[Accept]   [Skip]
```

### After Accepting:
```
┌──────────────────────────────────────┐
│  ✓ Order Accepted!                   │
│                                      │
│  The order has been moved to your    │
│  active orders. Click "Start         │
│  Shopping" when you're ready to      │
│  begin.                              │
│                                      │
│  [Start Shopping Now]  [Start Later]│
└──────────────────────────────────────┘
```

---

## 🛒 Step 2: Shopping the Order

### Shopping Interface Layout:

```
┌──────────────────────────────────────────────────────────┐
│  Order #12345          ⏱️ 00:15:32          [Pause] [?] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Progress: 8/23 items  ████████░░░░░░░░░░░ 35%         │
│                                                          │
│  ┌─ SHOPPING LIST ────────────────────────────────────┐ │
│  │                                                     │ │
│  │  ✓ Milk, Whole, 1gal          Found  $5.99        │ │
│  │  ✓ Eggs, Large, 12ct          Found  $3.49        │ │
│  │  ⟳ Chicken Breast, 2lb        Looking $12.99      │ │ ← Current
│  │  ○ Bananas, 5ct               Pending $2.50       │ │
│  │  ○ Bread, Whole Wheat         Pending $4.29       │ │
│  │  ○ Butter, Salted, 1lb        Pending $6.99       │ │
│  │  ...                                               │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  Current Item: Chicken Breast, 2lb                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  [Photo Reference]                                  │ │
│  │                                                     │ │
│  │  Category: Meat & Poultry                          │ │
│  │  Expected Price: $12.99                            │ │
│  │  Location: Meat Section, Aisle 12                  │ │
│  │                                                     │ │
│  │  Customer Note: "Furthest expiration date please"  │ │
│  │                                                     │ │
│  │  [✓ Found]  [✗ Out of Stock]  [? Issue]          │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Item Status Icons:
| Icon | Status | Meaning |
|------|--------|---------|
| ✓ | Found | Item successfully located |
| ⟳ | Looking | Currently searching for this item |
| ○ | Pending | Haven't started looking yet |
| ✗ | Out of Stock | Item unavailable, needs substitution |
| ⚠️ | Issue | Problem needs attention |

### Shopping Workflow:

```
Step 1: Review Item Details
   │
   ├─ Read customer notes
   ├─ Note location
   └─ Check special requirements
   │
   ↓
Step 2: Navigate to Location
   │
   └─ Use store layout knowledge
   │
   ↓
Step 3: Find Product
   │
   ├─ YES → Quality Check → Mark "Found"
   │
   └─ NO → Check stock → Out of Stock Flow
```

---

## ✅ Step 3: Quality Checks

### Visual Quality Guide:

#### Produce Quality Standards
```
┌─────────────────────────────────────────────┐
│  PRODUCE QUALITY CHECKLIST                  │
├─────────────────────────────────────────────┤
│                                             │
│  ✓ Firmness:                                │
│    • Squeeze gently                         │
│    • No soft spots                          │
│    • No bruising                            │
│                                             │
│  ✓ Color:                                   │
│    • Vibrant, not dull                      │
│    • Consistent coloring                    │
│    • No discoloration                       │
│                                             │
│  ✓ Ripeness:                                │
│    • Check customer preference              │
│    • Default: Ready to eat today            │
│    • If staying multiple days: Less ripe   │
│                                             │
│  ✓ No Damage:                               │
│    • No cuts or tears                       │
│    • No mold or decay                       │
│    • Stems intact                           │
└─────────────────────────────────────────────┘
```

#### Meat & Seafood Standards
```
┌─────────────────────────────────────────────┐
│  MEAT & SEAFOOD QUALITY CHECKLIST           │
├─────────────────────────────────────────────┤
│                                             │
│  ✓ Date:                                    │
│    • Furthest expiration date               │
│    • Minimum 3 days remaining               │
│    • Check "sell by" vs "use by"           │
│                                             │
│  ✓ Color:                                   │
│    • Beef: Bright red                       │
│    • Chicken: Pink, not gray                │
│    • Fish: Clear, not milky                 │
│                                             │
│  ✓ Packaging:                               │
│    • Sealed properly                        │
│    • No tears or leaks                      │
│    • No excess liquid                       │
│                                             │
│  ✓ Feel:                                    │
│    • Cold to touch                          │
│    • Firm texture                           │
│    • No sliminess                           │
└─────────────────────────────────────────────┘
```

#### Dairy Products Standards
```
┌─────────────────────────────────────────────┐
│  DAIRY QUALITY CHECKLIST                    │
├─────────────────────────────────────────────┤
│                                             │
│  ✓ Expiration Date:                         │
│    • Always pick furthest date              │
│    • Minimum 5 days for milk                │
│    • Check all date formats                 │
│                                             │
│  ✓ Seal Integrity:                          │
│    • Cap/seal unbroken                      │
│    • No bulging containers                  │
│    • No leaking                             │
│                                             │
│  ✓ Temperature:                             │
│    • Cold to touch                          │
│    • From back of cooler when possible      │
│    • No condensation (freezer items)        │
└─────────────────────────────────────────────┘
```

### Marking Items Found:

```
When Item Passes Quality Check:
┌────────────────────────────────┐
│  Chicken Breast, 2lb           │
│                                │
│  Quality: ✓ Good               │
│  Date: 10/30 (5 days)          │
│  Price: $12.99 ✓               │
│                                │
│     [✓ Mark as Found]          │ ← Click here
└────────────────────────────────┘
        ↓
Item moves to "Found" section
        ↓
Next item automatically loads
        ↓
Continue shopping
```

---

## 🔄 Step 4: Handling Substitutions

### Out of Stock Flow:

```
Item Not Available
       ↓
Click [Out of Stock]
       ↓
┌───────────────────────────────────────┐
│  Item Out of Stock                    │
│  Original: Chicken Breast, 2lb        │
│                                       │
│  What would you like to do?           │
│                                       │
│  ○ Suggest a substitution             │ ← Select this
│  ○ Skip item (customer's choice)      │
│  ○ Contact customer first             │
│                                       │
│  [Continue]                           │
└───────────────────────────────────────┘
```

### Substitution Process:

#### Step 1: Find Alternative
```
┌─────────────────────────────────────────────┐
│  SUGGEST SUBSTITUTION                       │
├─────────────────────────────────────────────┤
│                                             │
│  Original Item:                             │
│  Chicken Breast, Organic, 2lb               │
│  Price: $12.99                              │
│                                             │
│  Your Suggested Alternative:                │
│  ┌─────────────────────────────────────┐   │
│  │ Chicken Breast, Regular, 2lb       │   │
│  │ Price: $9.99                       │   │
│  │ Brand: Foster Farms                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Why this substitute?                       │
│  ┌─────────────────────────────────────┐   │
│  │ ○ Same item, different brand       │   │
│  │ ● Similar item, lower price        │   │ ← Check reason
│  │ ○ Similar item, higher quality     │   │
│  │ ○ Different but comparable product │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  📸 [Take Photo of Alternative]             │ ← Required
│                                             │
│  Add Note (optional):                       │
│  ┌─────────────────────────────────────┐   │
│  │ "Same cut, non-organic, good        │   │
│  │  quality, saves $3"                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Send to Customer]                         │
└─────────────────────────────────────────────┘
```

#### Step 2: Take Photo
```
Photo Guidelines:
┌────────────────────────────────┐
│  📸 SUBSTITUTION PHOTO         │
├────────────────────────────────┤
│                                │
│  ✓ Show full product label     │
│  ✓ Include price tag           │
│  ✓ Clear, well-lit photo       │
│  ✓ Show expiration date        │
│  ✗ No blurry images            │
│  ✗ No dark photos              │
│                                │
│  [📷 Take Photo]               │
│  [🔄 Retake]  [✓ Use Photo]   │
└────────────────────────────────┘
```

#### Step 3: Wait for Response
```
┌──────────────────────────────────────┐
│  ⏳ WAITING FOR CUSTOMER APPROVAL    │
├──────────────────────────────────────┤
│                                      │
│  Substitution sent: 11:45 AM         │
│  Average response time: 3-5 min      │
│                                      │
│  While you wait:                     │
│  • Continue with other items         │
│  • Return to this item later         │
│  • Check for customer message        │
│                                      │
│  Status: Awaiting response ⏳        │
│                                      │
│  [View Substitution]  [Send Message]│
└──────────────────────────────────────┘
```

#### Customer Response Scenarios:

```
Scenario A: APPROVED ✓
┌────────────────────────────────┐
│  ✓ Substitution Approved!      │
│  Customer accepted your        │
│  suggestion. Proceed with      │
│  alternative item.             │
│                                │
│  [✓ Add to Cart]               │
└────────────────────────────────┘

Scenario B: REJECTED ✗
┌────────────────────────────────┐
│  ✗ Substitution Declined       │
│  Customer chose to skip this   │
│  item. Continue with order.    │
│                                │
│  [Continue Shopping]           │
└────────────────────────────────┘

Scenario C: DIFFERENT REQUEST 💬
┌────────────────────────────────┐
│  💬 Customer Responded:         │
│  "Can you find Brand X instead?"│
│                                │
│  [Search for Brand X]          │
│  [Reply to Customer]           │
└────────────────────────────────┘
```

---

## 💬 Step 5: Customer Communication

### Messaging Interface:

```
┌──────────────────────────────────────────────┐
│  💬 MESSAGE CUSTOMER                         │
├──────────────────────────────────────────────┤
│  Order #12345 - John Smith                   │
│                                              │
│  Conversation:                               │
│  ┌──────────────────────────────────────┐   │
│  │ You: Suggested chicken substitute    │   │
│  │ 11:45 AM                             │   │
│  │                              ┌───┐   │   │
│  │                              └───┘   │   │
│  │                                      │   │
│  │  ┌───┐                               │   │
│  │  └───┘                               │   │
│  │ Customer: Looks good, approved!      │   │
│  │ 11:47 AM                             │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Quick Messages:                             │
│  [Running a bit behind]                      │
│  [Found great produce!]                      │
│  [Question about item]                       │
│  [Almost done shopping]                      │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ Type your message...     [Send]    │     │
│  └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

### When to Message Customer:

```
✓ ALWAYS MESSAGE FOR:
┌────────────────────────────────┐
│ • Out of stock (with photo)    │
│ • Price differences >$5        │
│ • Quality concerns             │
│ • Unclear instructions         │
│ • Delays over 15 minutes       │
└────────────────────────────────┘

✓ GOOD TO MESSAGE:
┌────────────────────────────────┐
│ • Found amazing deals          │
│ • Extra fresh items            │
│ • Halfway done update          │
│ • Special finds they'd like    │
└────────────────────────────────┘

✗ DON'T MESSAGE FOR:
┌────────────────────────────────┐
│ • Every single item found      │
│ • Minor updates                │
│ • Already-approved subs        │
└────────────────────────────────┘
```

---

## 📦 Step 6: Organizing & Packing

### Shopping Cart Organization:

```
┌─────────────────────────────────────────┐
│  CART ORGANIZATION                      │
├─────────────────────────────────────────┤
│                                         │
│  🧊 COLD ITEMS (Keep together)          │
│  ┌───────────────────────────────────┐ │
│  │ • Milk                            │ │
│  │ • Chicken                         │ │
│  │ • Eggs                            │ │
│  │ • Butter                          │ │
│  │ • Ice cream                       │ │
│  └───────────────────────────────────┘ │
│                                         │
│  🍞 DRY/PACKAGED ITEMS                  │
│  ┌───────────────────────────────────┐ │
│  │ • Bread                           │ │
│  │ • Canned goods                    │ │
│  │ • Pasta                           │ │
│  │ • Cereals                         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  🍎 PRODUCE (Protect from crushing)     │
│  ┌───────────────────────────────────┐ │
│  │ • Bananas (on top)                │ │
│  │ • Tomatoes (careful)              │ │
│  │ • Lettuce (don't crush)           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  🥚 FRAGILE (Extra care)                │
│  ┌───────────────────────────────────┐ │
│  │ • Eggs (check not broken)         │ │
│  │ • Chips (don't stack)             │ │
│  │ • Berries (gentle handling)       │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Bagging Best Practices:

```
┌───────────────────────────────────────┐
│  BAGGING STRATEGY                     │
├───────────────────────────────────────┤
│                                       │
│  Bag 1: Heavy/Stable Items            │
│  └─ Cans, boxes, bottles              │
│     (Bottom of bag)                   │
│                                       │
│  Bag 2: Cold Items + Ice Packs        │
│  └─ Dairy, meat, frozen               │
│     (Use insulated bag)               │
│                                       │
│  Bag 3: Produce                       │
│  └─ Fruits & vegetables               │
│     (Don't mix with heavy items)      │
│                                       │
│  Bag 4: Fragile Items                 │
│  └─ Eggs, chips, bread                │
│     (Keep separate, on top)           │
│                                       │
│  Bag Weight Limit:                    │
│  • Maximum 15-20 lbs per bag          │
│  • Must be able to lift comfortably   │
│  • Double-bag if needed               │
└───────────────────────────────────────┘
```

---

## ✅ Step 7: Completing the Order

### Pre-Completion Checklist:

```
┌────────────────────────────────────────┐
│  ✓ FINAL CHECK BEFORE COMPLETION       │
├────────────────────────────────────────┤
│                                        │
│  □ All items marked (found or skipped) │
│  □ All substitutions approved          │
│  □ Quality check passed on all items   │
│  □ Customer messages responded to      │
│  □ Items organized in cart properly    │
│  □ Cold items in insulated bags        │
│  □ Fragile items protected             │
│  □ Receipt checked                     │
│                                        │
│  When all boxes checked:               │
│  [✓ Mark Order Complete]               │
└────────────────────────────────────────┘
```

### Completion Interface:

```
┌──────────────────────────────────────────────┐
│  COMPLETE ORDER #12345                       │
├──────────────────────────────────────────────┤
│                                              │
│  Order Summary:                              │
│  • Total items: 23                           │
│  • Found: 21                                 │
│  • Substituted: 2 (both approved)            │
│  • Skipped: 0                                │
│                                              │
│  Time Spent: 42 minutes ✓ (Target: 45 min)  │
│  Find Rate: 91% ✓ (Target: 95%)             │
│                                              │
│  Final Order Total: $234.50                  │
│  • Original estimate: $240.00                │
│  • Savings: $5.50                            │
│                                              │
│  Staging Location:                           │
│  ┌──────────────────────────────────────┐   │
│  │ ○ Pickup Area A                      │   │
│  │ ● Pickup Area B  ← Select            │   │
│  │ ○ Pickup Area C                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Add Final Note to Driver:                   │
│  ┌──────────────────────────────────────┐   │
│  │ "5 bags total. Cold items in         │   │
│  │  insulated bag #2. Fragile eggs      │   │
│  │  in bag #4."                         │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [Complete Order]                            │
└──────────────────────────────────────────────┘
```

### After Completion:

```
┌────────────────────────────────────┐
│  ✓ ORDER COMPLETED!                │
├────────────────────────────────────┤
│                                    │
│  Great job! Order #12345 is ready  │
│  for driver pickup.                │
│                                    │
│  Your Performance:                 │
│  • Time: 42 min (Target: 45)  ✓   │
│  • Find Rate: 91%             ✓   │
│  • Customer Rating: Pending        │
│                                    │
│  Earnings: $15.00                  │
│  + Possible tip: $5-10             │
│                                    │
│  [View Receipt]  [Next Order]     │
└────────────────────────────────────┘
```

---

## 📊 Performance Tracking

### Your Stats Dashboard:

```
┌──────────────────────────────────────────────────────┐
│  YOUR PERFORMANCE                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  TODAY:                                              │
│  ┌─────────┬─────────┬─────────┬─────────┐         │
│  │ Orders  │ Earnings│ Rating  │Find Rate│         │
│  │   5     │ $75.00  │ ⭐4.8   │  96%   │         │
│  └─────────┴─────────┴─────────┴─────────┘         │
│                                                      │
│  THIS WEEK:                                          │
│  ┌─────────┬─────────┬─────────┬─────────┐         │
│  │ Orders  │ Earnings│ Avg Time│Response │         │
│  │  23     │ $345.00 │ 38 min  │  3 min  │         │
│  └─────────┴─────────┴─────────┴─────────┘         │
│                                                      │
│  PERFORMANCE GOALS:                                  │
│  Find Rate:     [████████░░] 96% (Target: 95%) ✓   │
│  Speed:         [██████████] 40 items/hr       ✓   │
│  Rating:        [█████████░] 4.8/5.0          ✓   │
│  Response Time: [██████████] 3 min (Target:5)  ✓   │
│                                                      │
│  🎯 All targets met! Keep up the great work!        │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Pro Tips

### Efficiency Tips:

```
┌────────────────────────────────────────┐
│  ⚡ SPEED SHOPPING TECHNIQUES          │
├────────────────────────────────────────┤
│                                        │
│  1. Learn Store Layout                 │
│     • Memorize aisle numbers           │
│     • Know where items typically are   │
│     • Plan optimal route through store │
│                                        │
│  2. Group Items by Section             │
│     • Shop all produce together        │
│     • Then move to dairy               │
│     • Save frozen for last             │
│                                        │
│  3. Use Cart Organization              │
│     • Separate cold from dry           │
│     • Protect fragile items            │
│     • Keep similar items together      │
│                                        │
│  4. Batch Substitution Requests        │
│     • Find all substitutes first       │
│     • Take all photos together         │
│     • Send as one batch                │
│                                        │
│  5. Communicate Proactively            │
│     • Message halfway point            │
│     • Update on any delays             │
│     • Share good finds                 │
└────────────────────────────────────────┘
```

---

*Print and reference during your shifts for maximum efficiency!*
