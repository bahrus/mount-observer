# Requirement 8: Create End-to-End Examples and Documentation

## Goal
Develop comprehensive examples and documentation showing the complete unified architecture from HTML attributes through assign-gingerly to mount-observer.

## Background
After implementing Requirements 1-7, we have a complete system but need to demonstrate:
- How the pieces fit together
- Migration paths from old patterns
- Best practices for different use cases
- The value proposition of the unified approach

## Proposed Examples

### Example 1: Simple Counter (Server-Rendered HTML)
Demonstrates initial attribute reading without ongoing observation.

```html
<!-- HTML -->
<button data-count="5" data-label="Click me">
  <span class="label"></span>
  <span class="count"></span>
</button>
```

```typescript
// Enhancement class
class ButtonCounter {
  count: number = 0;
  label: string = '';
  
  constructor(
    private element: HTMLButtonElement,
    ctx: SpawnContext,
    initVals?: Partial<ButtonCounter>
  ) {
    // initVals contains parsed attributes: { count: 5, label: "Click me" }
    Object.assign(this, initVals);
    this.render();
    this.element.addEventListener('click', () => this.increment());
  }
  
  increment() {
    this.count++;
    this.render();
  }
  
  render() {
    this.element.querySelector('.label')!.textContent = this.label;
    this.element.querySelector('.count')!.textContent = String(this.count);
  }
}

// Mount-observer configuration
const mountInit: MountInit = {
  whereElementMatches: 'button',
  whereAttr: {
    hasBuiltInRootIn: ['data'],
    hasBase: 'count',
    hasBranchIn: ['', { label: [''] }]
  },
  map: {
    '0': { mapsTo: 'count', instanceOf: 'Number', once: true },
    '0.0': { mapsTo: 'label', instanceOf: 'String', once: true }
  },
  spawn: ButtonCounter,
  enhKey: 'counter'
};

// Usage
const observer = new MountObserver([mountInit]);
observer.observe(document.body);

// Later, programmatic access
const button = document.querySelector('button')!;
button.enh.counter.count = 10; // Direct manipulation
```

### Example 2: Reactive Attributes
Demonstrates ongoing attribute observation.

```html
<div data-theme="dark" data-size="large">Content</div>
```

```typescript
class ThemeableDiv {
  theme: string = 'light';
  size: string = 'medium';
  
  constructor(
    private element: HTMLDivElement,
    ctx: SpawnContext,
    initVals?: Partial<ThemeableDiv>
  ) {
    Object.assign(this, initVals);
    this.applyTheme();
  }
  
  applyTheme() {
    this.element.className = `theme-${this.theme} size-${this.size}`;
  }
}

const mountInit: MountInit = {
  whereElementMatches: 'div[data-theme]',
  whereAttr: {
    hasBuiltInRootIn: ['data'],
    hasBase: 'theme',
    hasBranchIn: ['', { size: [''] }]
  },
  map: {
    '0': { mapsTo: 'theme', once: false }, // Observe changes!
    '0.0': { mapsTo: 'size', once: false }
  },
  spawn: ThemeableDiv,
  enhKey: 'themeable',
  // Callback to apply changes when attributes change
  do: (element: Element) => {
    const instance = (element as any).enh.themeable;
    if (instance) {
      instance.applyTheme();
    }
  }
};
```

### Example 3: Hybrid Approach (Attributes + Programmatic)
Demonstrates mixing server-rendered defaults with programmatic overrides.

```html
<form data-endpoint="/api/submit" data-method="POST">
  <!-- form fields -->
</form>
```

```typescript
class FormEnhancement {
  endpoint: string = '/api/default';
  method: string = 'GET';
  loading: boolean = false;
  
  constructor(
    private element: HTMLFormElement,
    ctx: SpawnContext,
    initVals?: Partial<FormEnhancement>
  ) {
    // Attributes provide defaults
    Object.assign(this, initVals);
    
    this.element.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });
  }
  
  async submit() {
    this.loading = true;
    try {
      const response = await fetch(this.endpoint, {
        method: this.method,
        body: new FormData(this.element)
      });
      // Handle response
    } finally {
      this.loading = false;
    }
  }
}

// Mount configuration
const mountInit: MountInit = {
  whereElementMatches: 'form[data-endpoint]',
  whereAttr: {
    hasBuiltInRootIn: ['data'],
    hasBase: 'endpoint',
    hasBranchIn: ['', { method: [''] }]
  },
  map: {
    '0': { mapsTo: 'endpoint', once: true },
    '0.0': { mapsTo: 'method', once: true }
  },
  spawn: FormEnhancement,
  enhKey: 'form'
};

// Later, programmatic override
const form = document.querySelector('form')!;
form.enh.form.endpoint = '/api/v2/submit'; // Override HTML default
form.enh.form.method = 'PUT';
```

### Example 4: Dependency Injection with Attributes
Demonstrates using both attribute mapping and DI mapping.

```html
<article data-article-id="123" data-author="John">
  <!-- content -->
</article>
```

```typescript
const ArticleService = Symbol.for('ArticleService');

class ArticleEnhancement {
  articleId: string = '';
  author: string = '';
  articleService: any; // Injected
  
  constructor(
    private element: HTMLElement,
    ctx: SpawnContext,
    initVals?: Partial<ArticleEnhancement>
  ) {
    Object.assign(this, initVals);
    this.loadArticle();
  }
  
  async loadArticle() {
    const data = await this.articleService.fetch(this.articleId);
    // Render article data
  }
}

const mountInit: MountInit = {
  whereElementMatches: 'article[data-article-id]',
  whereAttr: {
    hasBuiltInRootIn: ['data'],
    hasBase: 'article',
    hasBranchIn: [{ id: [''], author: [''] }]
  },
  map: {
    '0.0': { mapsTo: 'articleId', once: true },
    '0.1': { mapsTo: 'author', once: true }
  },
  diMap: {
    [ArticleService]: 'articleService' // DI mapping
  },
  spawn: ArticleEnhancement,
  enhKey: 'article'
};

// Register service in DI registry
customElements.assignGingerlyRegistry.push({
  spawn: class { /* ArticleService implementation */ },
  map: { [ArticleService]: 'instance' }
});
```

## Documentation Structure

### 1. Architecture Overview
- Diagram showing the relationship between packages
- Flow chart: HTML → assign-gingerly → mount-observer
- Explanation of separation of concerns

### 2. Core Concepts
- Initial attribute reading vs ongoing observation
- `IBaseRegistryItem` vs `MountInit`
- `attrMappings` vs `MapConfig`
- `map` (DI) vs `diMap` vs `map` (attributes)

### 3. Migration Guide
- From `do` callbacks to `spawn` classes
- From mount-observer-only to unified approach
- From assign-gingerly-only to mount-observer integration

### 4. API Reference
- `IBaseRegistryItem` interface
- `MountInit` interface
- `AttrMapping` interface
- Standard parsers
- Lifecycle methods

### 5. Best Practices
- When to use `initialOnly: true` vs `false`
- When to use `spawn` vs `do`
- How to structure enhancement classes
- Performance considerations

### 6. Troubleshooting
- Common issues and solutions
- Debugging tips
- Performance profiling

## Testing Strategy

### Integration Tests
Create tests that verify the complete flow:

```typescript
describe('Unified Architecture', () => {
  it('should read initial attributes and spawn class', async () => {
    document.body.innerHTML = '<button data-count="5">Click</button>';
    
    const mountInit: MountInit = {
      whereElementMatches: 'button',
      whereAttr: { hasBuiltInRootIn: ['data'], hasBase: 'count' },
      map: { '0': { mapsTo: 'count', instanceOf: 'Number' } },
      spawn: ButtonCounter,
      enhKey: 'counter'
    };
    
    const observer = new MountObserver([mountInit]);
    await observer.observe(document.body);
    
    const button = document.querySelector('button')!;
    expect(button.enh.counter).toBeInstanceOf(ButtonCounter);
    expect(button.enh.counter.count).toBe(5);
  });
  
  it('should observe attribute changes', async () => {
    // Test ongoing observation
  });
  
  it('should merge attributes with programmatic values', async () => {
    // Test precedence
  });
});
```

## Benefits
- Clear understanding of the unified architecture
- Practical examples for common use cases
- Migration path for existing users
- Reduced learning curve

## Deliverables
1. Example files in `examples/` directory
2. Updated README.md in both packages
3. Architecture diagram (SVG or Mermaid)
4. Migration guide document
5. API reference documentation
6. Integration test suite

## Next Steps
After this, we should gather feedback from early adopters and iterate on the API based on real-world usage.
