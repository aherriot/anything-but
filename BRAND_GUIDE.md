# Anything, but... - Brand Guide

## Overview

Anything, but... is a fun, collaborative restaurant selection app that brings people together through food. The brand identity reflects warmth, friendliness, and the joy of shared dining experiences.

## Color Palette

### Primary Colors - Warm Orange

Inspired by the warmth of cooking and the vibrant colors of food.

- **Primary 500** (`#f97316`) - Main brand color, use for primary CTAs, links, and key UI elements
- **Primary 600** (`#ea5a0c`) - Hover states and emphasis
- **Primary 50-100** - Light backgrounds and subtle highlights
- **Primary 700-900** - Text and darker elements

### Secondary Colors - Fresh Green

Represents fresh ingredients, healthy choices, and growth.

- **Secondary 500** (`#22c55e`) - Secondary actions, success states, vegetarian/healthy options
- **Secondary 600** (`#16a34a`) - Hover states
- **Secondary 50-100** - Light backgrounds for positive messaging

### Accent Colors - Premium Purple

For special features, premium options, and creating visual hierarchy.

- **Accent 500** (`#a855f7`) - Premium features, special occasions, night dining
- **Accent 600** (`#9333ea`) - Hover states
- **Accent 50-100** - Light backgrounds for premium content

### Semantic Colors

- **Success**: Green variants for confirmations, successful matches
- **Warning**: Amber for cautions, dietary restrictions
- **Error**: Red for errors, unavailable options
- **Info**: Blue for information, tips, and guidance

## Typography

### Font Family

**Inter** - Clean, modern, highly readable across all devices and sizes.

### Text Styles

- **Heading XL** (3rem/48px) - Hero headlines, main page titles
- **Heading LG** (2.25rem/36px) - Section headings, modal titles
- **Heading MD** (1.875rem/30px) - Card titles, step headers
- **Heading SM** (1.5rem/24px) - Subsection headings
- **Body LG** (1.125rem/18px) - Important descriptions, intros
- **Body** (1rem/16px) - Standard body text
- **Body SM** (0.875rem/14px) - Captions, helper text

## Component Styles

### Buttons

```html
<!-- Primary button for main actions -->
<button class="btn-primary">Find Restaurants</button>
<button
  class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-primary hover:shadow-lg hover:-translate-y-0.5"
>
  Find Restaurants
</button>

<!-- Secondary button for alternative actions -->
<button class="btn-secondary">Save for Later</button>
<button
  class="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-secondary hover:shadow-lg hover:-translate-y-0.5"
>
  Save for Later
</button>

<!-- Outline button for tertiary actions -->
<button class="btn-outline">Cancel</button>
<button
  class="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-primary hover:-translate-y-0.5"
>
  Cancel
</button>
```

### Cards

```html
<!-- Standard card -->
<div class="card">
  <h3 class="heading-sm">Restaurant Name</h3>
  <p class="body-sm text-neutral-600">Description...</p>
</div>

<!-- Interactive/selectable card -->
<div class="card-interactive">
  <h3 class="heading-sm">Choose this option</h3>
</div>

<!-- With Tailwind classes -->
<div
  class="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-all border border-neutral-200 hover:-translate-y-1"
>
  <h3 class="text-xl font-semibold mb-2">Restaurant Name</h3>
  <p class="text-neutral-600 text-sm">Description...</p>
</div>
```

### Form Elements

```html
<!-- Input field -->
<input class="input" type="text" placeholder="Enter location" />
<input
  class="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
  type="text"
  placeholder="Enter location"
/>
```

## Usage Guidelines

### Primary Actions

Use **Primary Orange** for:

- Main call-to-action buttons
- Active navigation items
- Progress indicators
- Selected states

### Secondary Actions

Use **Secondary Green** for:

- Success messages
- Confirmation buttons
- Healthy/vegetarian options
- Positive feedback

### Accent Elements

Use **Accent Purple** for:

- Premium features
- Special occasions
- Night dining themes
- VIP/exclusive content

### Background Patterns

```html
<!-- Gradient backgrounds -->
<div class="bg-gradient-primary">Primary gradient</div>
<div class="bg-gradient-warm">Warm gradient (primary to accent)</div>
<div class="bg-gradient-fresh">Fresh gradient (secondary to primary)</div>

<!-- With Tailwind -->
<div class="bg-gradient-to-br from-primary-500 to-primary-600">
  Primary gradient
</div>
<div class="bg-gradient-to-br from-primary-500 to-accent-500">
  Warm gradient
</div>
<div class="bg-gradient-to-br from-secondary-500 to-primary-500">
  Fresh gradient
</div>
```

### Text Gradients

```html
<!-- Gradient text for headings -->
<h1 class="text-gradient-primary">Anything, but...</h1>
<h2 class="text-gradient-warm">Find Your Perfect Meal</h2>

<!-- With Tailwind -->
<h1
  class="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent"
>
  Anything, but...
</h1>
```

## Accessibility

### Color Contrast

All color combinations meet WCAG AA standards:

- Primary text on white: 4.5:1 contrast ratio
- Secondary text on light backgrounds: 3:1 minimum
- Interactive elements have clear focus states

### Interactive States

- **Hover**: Slightly darker color + subtle lift effect
- **Focus**: Color ring matching the element's theme
- **Active**: Pressed state with darker color
- **Disabled**: Reduced opacity with no interactions

## Responsive Design

### Mobile Optimizations

- Larger touch targets (minimum 44px)
- Simplified layouts with more whitespace
- Reduced font sizes for headings
- Simplified button styles

### Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Animation Guidelines

### Micro-interactions

- **Hover effects**: 0.2s ease transition
- **Button presses**: Quick scale + color change
- **Card interactions**: Subtle lift on hover

### Page Transitions

- **Slide up**: For modals and new content
- **Fade in**: For content loading
- **Bounce gentle**: For success states and celebrations

## Example Implementation

```html
<!-- Hero section example -->
<div class="bg-gradient-warm min-h-screen flex items-center justify-center p-6">
  <div class="text-center text-white animate-slide-up">
    <h1 class="heading-xl mb-4">Welcome to Anything, but...</h1>
    <p class="body-lg mb-8 max-w-2xl mx-auto">
      The fun way to choose restaurants with friends and family
    </p>
    <button class="btn-primary bg-white text-primary-500 hover:bg-neutral-50">
      Start Choosing
    </button>
  </div>
</div>

<!-- Restaurant card example -->
<div class="card-interactive max-w-sm">
  <div class="flex items-center mb-3">
    <span class="text-2xl mr-3">🍕</span>
    <div>
      <h3 class="heading-sm">Tony's Pizza</h3>
      <div class="flex items-center">
        <span class="star-emoji text-warning"></span>
        <span class="body-sm text-neutral-600">4.5 (120 reviews)</span>
      </div>
    </div>
  </div>
  <p class="body-sm text-neutral-600 mb-4">
    Authentic Italian pizza with fresh ingredients
  </p>
  <div class="flex justify-between items-center">
    <span class="location-emoji body-sm text-neutral-500">Downtown</span>
    <span class="body-sm font-semibold text-primary-500">$$</span>
  </div>
</div>
```

This brand system creates a cohesive, friendly, and food-focused identity that will make your collaborative restaurant selection app both visually appealing and highly functional.
