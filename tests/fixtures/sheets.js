module.exports = [
  {
    name: 'salad',
    description: 'a really great sheet about salad',
    organization: 'health',
    categories: ['healthy', 'food'],
    websites: ['http://example.com'],
    owners: { nutrionist: true },
    editors: { eater: true },
    private: false,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  },
  {
    name: 'brisket',
    description: 'a really great sheet about brisket',
    organization: 'awesome',
    categories: ['grill', 'yum', 'food'],
    websites: ['http://example.com'],
    owners: { griller: true },
    editors: { eater: true },
    private: true,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  },
  {
    name: 'pizza',
    description: 'a really great sheet with stuff',
    organization: 'awesome',
    categories: ['food', 'yum'],
    websites: ['http://example.com'],
    owners: { pizzamaker: true },
    editors: { eater: true },
    private: true,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  },
  {
    name: 'popcorn',
    description: 'yum snack food',
    organization: 'snacks',
    categories: ['meh'],
    websites: ['http://example.com'],
    owners: { popcornpopper: true },
    editors: { eater: true },
    private: true,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  },
  {
    name: 'coffee',
    description: 'liquid',
    organization: 'awesome',
    categories: ['drink'],
    websites: ['http://example.com'],
    owners: { barista: true },
    editors: { drinker: true, pizzamaker: true },
    private: true,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  }
]