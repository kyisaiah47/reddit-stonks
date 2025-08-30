# Devvit Documentation

## Redis

You can add a database to your app to store and retrieve data. The Redis plugin is designed to be fast, scalable, and secure. It supports a subset of the full Redis API, including:

- Transactions for things like counting votes atomically in polls
- String operations for persisting information
- Number operations for incrementing numbers
- Sorted sets for creating leaderboards
- Hashes for managing a collection of key-value pairs
- Bitfields for efficient operation on sequences of bits

Each app version installed on a subreddit is namespaced, which means Redis data is siloed from other subreddits. Keep in mind that there won't be a single source of truth for all installations of your app, since each app installation can only access the data that it has stored in the Redis database.

### Limits and Quotas

- **Max commands per second**: 1000
- **Max request size**: 5 MB
- **Max storage**: 500 MB

All limits are applied at a per-installation granularity.

### Redis Setup

#### Devvit Web Configuration

**devvit.json**

```json
{
  "permissions": {
    "redis": true
  }
}
```

**server/index.ts**

```typescript
import { redis } from '@devvit/redis';
```

### Supported Redis Commands

#### Simple Read/Write

- `get` - Gets the value of key
- `set` - Sets key to hold a string value
- `exists` - Returns number of given keys that exist
- `del` - Removes the specified keys
- `type` - Returns the string representation of the type of value stored at key
- `rename` - Renames a key

#### Batch Read/Write

- `mGet` - Returns the values of all specified keys
- `mSet` - Sets the given keys to their respective values

#### Strings

- `getRange` - Returns the substring of the string value stored at key
- `setRange` - Overwrites part of the string stored at key
- `strLen` - Returns the length of the string value stored at key

#### Hash

Redis hashes can store up to ~4.2 billion key-value pairs. We recommend using hash for managing collections of key-value pairs whenever possible and iterating over it using a combination of hscan, hkeys and hgetall.

- `hGet` - Returns the value associated with field in the hash stored at key
- `hMGet` - Returns the value of all specified field in the hash stored at multiple keys
- `hSet` - Sets the specified fields to their respective values in the hash stored at key
- `hSetNX` - Sets field in the hash stored at key to value, only if field does not yet exist
- `hDel` - Removes the specified fields from the hash stored at key
- `hGetAll` - Returns a map of fields and their values stored in the hash
- `hKeys` - Returns all field names in the hash stored at key
- `hScan` - Iterates fields of Hash types and their associated values
- `hIncrBy` - Increments the score of member in the sorted set stored at key by value
- `hLen` - Returns the number of fields contained in the hash stored at key

#### Numbers

- `incrBy` - Increments the number stored at key by increment

#### Key Expiration

- `expire` - Sets a timeout on key
- `expireTime` - Returns the remaining seconds at which the given key will expire

#### Transactions

Redis transactions allow a group of commands to be executed in a single isolated step. For example, to implement voting action in a polls app, these three actions need to happen together:

1. Store the selected option for the user
2. Increment the count for selected option
3. Add the user to voted user list

The watch command provides an entrypoint for transactions. It returns a TxClientLike which can be used to call multi, exec, discard, unwatch, and all other Redis commands to be executed within a transaction.

- `multi` - Marks the start of a transaction block
- `exec` - Executes all previously queued commands in a transaction and restores the connection state to normal
- `discard` - Flushes all previously queued commands in a transaction and restores the connection state to normal
- `watch` - Marks the given keys to be watched for conditional execution of a transaction
- `unwatch` - Flushes all the previously watched keys for a transaction

#### Sorted Set

- `zAdd` - Adds all the specified members with the specified scores to the sorted set stored at key
- `zCard` - Returns the sorted set cardinality (number of elements) of the sorted set stored at key
- `zRange` - Returns the specified range of elements in the sorted set stored at key
- `zRem` - Removes the specified members from the sorted set stored at key
- `zScore` - Returns the score of member in the sorted set at key
- `zRank` - Returns the rank of member in the sorted set stored at key
- `zIncrBy` - Increments the score of member in the sorted set stored at key by value
- `zScan` - Iterates elements of sorted set types and their associated scores
- `zRemRangeByLex` - Removes elements between lexicographical range when all elements have same score
- `zRemRangeByRank` - Removes all elements with rank between start and stop
- `zRemRangeByScore` - Removes all elements with score between min and max

#### Bitfield

- `bitfield` - Performs a sequence of operations on a bit string

---

## User Actions

User actions allow your app to perform certain actions—such as creating posts, comments, or subscribing to subreddits—on behalf of the user, rather than the app account. This enables richer, more interactive experiences while ensuring user control and transparency.

### What are User Actions?

By default, apps make posts or comments using their associated app account. With user actions enabled, your app can:

- Create posts or comments on behalf of the user (from the post UI, a form, or a menu action)
- Subscribe the user to the current subreddit

### Guidelines

To ensure a positive user experience and compliance with Reddit policies:

- **Be transparent**: Inform users and show them the content that will be posted on their behalf
- **Provide user control**: Users must opt in to allow the app to post on their behalf. If opt-in is persistent, make it clear how users can opt out

> **Note**: Apps using user actions must follow these guidelines to be approved.

### How It Works

**Unapproved/playtest apps:**

- `runAs: 'USER'` will operate from the app account unless the app owner takes the action
- User actions taken by the app owner will be attributed to the app owner's username

**Approved apps:**

- After publishing and approval, `runAs: 'USER'` will operate on behalf of the user for all users

### Enabling User Actions

Add the required permissions to your `devvit.json`:

```json
{
  "reddit": {
    "asUser": ["SUBMIT_POST", "SUBMIT_COMMENT", "SUBSCRIBE_TO_SUBREDDIT"]
  }
}
```

After enabling, you can call certain Reddit APIs on behalf of the user by passing the option `runAs: 'USER'`.

Currently, the following APIs support this option:

- `submitPost()`
- `submitComment()`

If `runAs` is not specified, the API will use `runAs: 'APP'` by default.

### Parameters

| Parameter              | Description                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `runAs`                | The type of account to perform the action on behalf of: 'USER' or 'APP'. Defaults to 'APP'                              |
| `userGeneratedContent` | Text or images submitted by the user. Required for `submitPost()` with `runAs: 'USER'` for safety and compliance review |

> **Note**: Apps that use `submitPost()` with `runAs: 'USER'` require `userGeneratedContent` to be approved by Reddit.

### Example: Submit a Post as the User

```typescript
import { reddit } from '@devvit/web/server';

router.post('/internal/post-create', async (_req, res) => {
  const { subredditName } = context;
  if (!subredditName) {
    res.status(400).json({ status: 'error', message: 'subredditName is required' });
    return;
  }

  reddit.submitPost({
    runAs: 'USER',
    userGeneratedContent: {
      text: "Hello there! This is a new post from the user's account",
    },
    subredditName,
    title: 'Post Title',
    splash: { appDisplayName: 'Test App' },
  });

  res.json({ status: 'success', message: `Post created in subreddit ${subredditName}` });
});
```

### Example: Subscribe to Subreddit

The subscribe API does not take a `runAs` parameter; it subscribes as the user by default (if specified in devvit.json and approved).

```typescript
import { reddit } from '@devvit/web/server';

await reddit.subscribeToCurrentSubreddit();
```

> **Note**: There is no API to check if the user is already subscribed to the subreddit. You may want to store the subscription state in Redis to provide contextually aware UI.

### Best Practices

- Always inform users before posting or commenting on their behalf
- Require explicit user opt-in for all user actions
- Use `userGeneratedContent` for all user-submitted posts
- Store user consent and subscription state if needed for your app's UX
- Follow Reddit's safety and compliance guidelines for user-generated content

---

## Post Data

You can attach custom data to posts when creating them and update this data at runtime using the `postData` capability. This enables dynamic, stateful experiences available on posts without additional redis calls. Post data is scoped to the post, not users.

Post data is useful for storing game state, scores, or any other information that needs to persist with the post and be shared across all users.

Post data is set when you submitPost and apps can access from the context object or do a server side call to update the post data on a Post object.

> **Note**: Post data is sent to the client. Never store secrets or sensitive information.

### Creating Posts with Data

When creating a post, include the `postData` parameter with your custom data object.

**server/index.ts**

```typescript
import { reddit } from '@devvit/web/server';

const post = await reddit.submitCustomPost({
  subredditName: context.subredditName!,
  title: 'Post with custom data',
  splash: {
    appDisplayName: 'Test App',
  },
  postData: {
    challengeNumber: 42,
    totalGuesses: 0,
    gameState: 'active',
    pixels: [
      [0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 2, 2, 1, 0, 0, 0, 0],
      [0, 0, 0, 2, 2, 1, 1, 1, 0, 0, 0],
      [0, 0, 2, 2, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 2, 2, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 2, 2, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 2, 2, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
    ], // Drawing canvas data
  },
});
```

### Updating Post Data

To update post data after creation, fetch the post and use the `setPostData()` method.

**server/index.ts**

```typescript
import { reddit } from '@devvit/web/server';

const post = await reddit.getPostById('t3_your_post_id');
await post.setPostData({ 'moreStuff': 'hello' });
```

> **Warning**: `setPostData()` replaces the entire post data object. To update specific fields while preserving others, merge the existing data with your updates.

### Accessing Post Data

Post data is available through `context.postData` in both client and server contexts.

**client/index.tsx**

```typescript
import { context } from '@devvit/web/client';

export const App = () => {
  return (
    <div>
      <text className='mt-1 font-bold'>Post Data:</text>
      <text>{JSON.stringify(context.postData, null, 2) ?? 'undefined'}</text>
    </div>
  );
}
```

### Limitations

Post data supports:

- JSON-serializable objects only
- Maximum size of 2KB
- Data persists with the post lifecycle (deleted when post is deleted)
- Updates to post data don't trigger automatic re-renders. Implement polling or refresh mechanisms as needed

---

## Splash Screens

Splash screens provide a personalized entry point for your Reddit Dev Platform apps, displaying a customized loading view before users interact with your post. A well-designed splash screen improves first impressions and drives better user engagement.

The splash screen appears when users first view your post, featuring your app's branding, a description, and a call-to-action button that launches the main experience.

> **Note**: Splash screens are only available for web view apps on Devvit Web.

### Creating Posts with Splash Screens

When creating a post, include the splash parameter to customize the splash screen appearance.

**server/index.ts**

```typescript
import { reddit } from '@devvit/web/server';

const post = await reddit.submitCustomPost({
  subredditName: context.subredditName!,
  title: 'My Interactive Post',
  splash: {
    appDisplayName: 'My Amazing App', // only required field
    backgroundUri: 'background.png',
    buttonLabel: 'Start Playing',
    description: 'An exciting interactive experience',
    entryUri: 'index.html',
    heading: 'Welcome to the Game!',
  },
  postData: {
    gameState: 'initial',
    score: 0,
  },
});
```

### Splash Screen Properties

The splash object supports the following customization options:

| Property         | Type   | Description                                                    | Default        |
| ---------------- | ------ | -------------------------------------------------------------- | -------------- |
| `appDisplayName` | string | Your app's display name                                        | Required       |
| `backgroundUri`  | string | Background image URL (relative to media directory or data URI) | None           |
| `buttonLabel`    | string | Text for the launch button                                     | 'Launch App'   |
| `description`    | string | Secondary text describing the post experience                  | None           |
| `entryUri`       | string | Web view URI relative to client directory                      | 'index.html'   |
| `heading`        | string | Large text naming the post under app name                      | appDisplayName |
| `appIconUri`     | string | Icon URL relative to media directory or data URI               | None           |

### Using Images

Images can be referenced in two ways:

**Local assets**: Place images in your app's `client/public` directory and reference them by filename:

> **Note**: To access assets in the `client/public` directory from the server, add the media property to your `devvit.json` file. The directory path should be relative to the `client/public` folder.

For example, to use an image at `client/public/assets/splash-background.png`:

**devvit.json**

```json
{
  "media": {
    "dir": "assets"
  }
}
```

**server/index.ts**

```typescript
backgroundUri: '/splash-background.png';
appIconUri: '/app-icon.png';
```

**External URLs**: Use full HTTPS URLs for hosted images:

```typescript
backgroundUri: 'https://i.redd.it/your-image.png';
```

### Example: Dynamic Splash Screens

You can create different splash screens based on context or user preferences:

```typescript
import { reddit } from '@devvit/web/server';

async function createThemedPost(theme: 'light' | 'dark', context: any) {
  const themes = {
    light: {
      backgroundUri: 'light-bg.png',
      heading: 'Bright Adventure',
      description: 'A cheerful experience awaits',
    },
    dark: {
      backgroundUri: 'dark-bg.png',
      heading: 'Night Mode Quest',
      description: 'Explore the shadows',
    },
  };

  const selectedTheme = themes[theme];

  return await reddit.submitCustomPost({
    subredditName: context.subredditName!,
    title: `${selectedTheme.heading} - Interactive Post`,
    splash: {
      appDisplayName: 'Theme Explorer',
      backgroundUri: selectedTheme.backgroundUri,
      buttonLabel: 'Begin Journey',
      description: selectedTheme.description,
      entryUri: 'game.html',
      heading: selectedTheme.heading,
    },
    postData: {
      theme: theme,
      initialized: false,
    },
  });
}
```

### Best Practices

- **Keep it lightweight**: Use optimized images to ensure fast loading times
- **Clear call-to-action**: Make your button label descriptive and action-oriented
- **Consistent branding**: Use your app icon and consistent visual elements
- **Informative description**: Tell users what to expect when they launch your app

### Limitations

- Image files must be included in your app bundle or hosted externally
- Maximum recommended image size: 2MB for optimal performance
- The entryUri must point to a valid HTML file in your client directory

> **Tip**: A compelling splash screen is your app's first impression. Invest time in creating an engaging design that clearly communicates your app's value and encourages users to interact.

---

## Settings and Secrets

Configure your app with settings that can be customized per subreddit or globally across all installations. Settings allow moderators to customize app behavior for their subreddit, while secrets enable secure storage of sensitive data like API keys.

Settings come in two scopes:

- **Subreddit settings**: Configurable by moderators for each installation
- **Global settings & Secrets**: Set by developers and shared across all installations

### Defining Settings

**devvit.json**

```json
{
  "settings": {
    "global": {
      "apiKey": {
        "type": "string",
        "label": "API Key",
        "defaultValue": "",
        "isSecret": true
      },
      "environment": {
        "type": "select",
        "label": "Environment",
        "options": [
          {
            "label": "Production",
            "value": "production"
          },
          {
            "label": "Development",
            "value": "development"
          }
        ],
        "defaultValue": "production"
      }
    },
    "subreddit": {
      "welcomeMessage": {
        "type": "string",
        "label": "Welcome Message",
        "validationEndpoint": "/internal/settings/validate-message",
        "defaultValue": "Welcome to our community!"
      },
      "enabledFeatures": {
        "type": "multiSelect",
        "label": "Enabled Features",
        "options": [
          {
            "label": "Auto-moderation",
            "value": "automod"
          },
          {
            "label": "Welcome posts",
            "value": "welcome"
          },
          {
            "label": "Statistics tracking",
            "value": "stats"
          }
        ],
        "defaultValue": ["welcome"]
      }
    }
  }
}
```

> **Note**: After defining settings in devvit.json, you must build your app (`npm run dev`) before you can set secrets via the CLI.

### Setting Types

Both frameworks support the following setting types:

- `string`: Text input field
- `boolean`: Toggle switch
- `number`: Numeric input
- `select`: Dropdown selection (single choice)
- `multiSelect` (Web) / `select` with `multiSelect: true` (Blocks): Multiple choice dropdown
- `paragraph`: Multi-line text input (Blocks only)
- `group`: Grouped settings for organization (Blocks only)

### Managing Secrets

Secrets are global settings marked with `isSecret: true`. They're encrypted and can only be set by developers via the CLI.

#### Listing Secrets

View all defined secrets in your app:

```bash
npx devvit settings list
```

#### Setting Secret Values

Only app developers can set secret values:

```bash
npx devvit settings set apiKey
```

> **Warning**: At least one app installation is required before you can store secrets via the CLI. You can run `npx devvit playtest` (or `npm run dev` in Devvit Web) to start your first installation.

### Accessing Settings in Your App

**server/index.ts**

```typescript
import { settings } from '@devvit/web/server';

// Get a single setting
const apiKey = await settings.get('apiKey');

// Get multiple settings
const [welcomeMessage, features] = await Promise.all([
  settings.get('welcomeMessage'),
  settings.get('enabledFeatures'),
]);

// Use in an endpoint
router.post('/api/process', async (req, res) => {
  const apiKey = await settings.get('apiKey');
  const environment = await settings.get('environment');

  const response = await fetch('https://api.example.com/endpoint', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-Environment': environment,
    },
  });

  res.json({ success: true });
});
```

### Input Validation

Define a validation endpoint in your `devvit.json` and implement it in your server:

**devvit.json**

```json
{
  "settings": {
    "subreddit": {
      "minimumAge": {
        "type": "number",
        "label": "Minimum Account Age (days)",
        "validationEndpoint": "/internal/settings/validate-age",
        "defaultValue": 7
      }
    }
  }
}
```

**server/index.ts**

```typescript
import { SettingsValidationRequest, SettingsValidationResponse } from '@devvit/web/server';

router.post(
  '/internal/settings/validate-age',
  async (
    req: Request<unknown, unknown, SettingsValidationRequest<number>>,
    res: Response<SettingsValidationResponse>
  ): Promise<void> => {
    const { value } = req.body;

    if (!value || value < 0) {
      res.json({
        success: false,
        error: 'Age must be a positive number',
      });
      return;
    }

    if (value > 365) {
      res.json({
        success: false,
        error: 'Maximum age is 365 days',
      });
      return;
    }

    res.json({ success: true });
  }
);
```

### Subreddit Settings UI

Once your app is installed, moderators can configure subreddit settings through the Install Settings page. These settings are scoped to the specific subreddit where the app is installed.

Moderators will see all non-secret settings defined for the subreddit scope and can update them as needed. Changes are saved immediately and available to your app.

### Complete Example

**devvit.json**

```json
{
  "settings": {
    "global": {
      "openaiApiKey": {
        "type": "string",
        "label": "OpenAI API Key",
        "isSecret": true,
        "defaultValue": ""
      }
    },
    "subreddit": {
      "aiModel": {
        "type": "select",
        "label": "AI Model",
        "options": [
          { "label": "GPT-4", "value": "gpt-4" },
          { "label": "GPT-3.5", "value": "gpt-3.5-turbo" }
        ],
        "defaultValue": "gpt-3.5-turbo"
      },
      "maxTokens": {
        "type": "number",
        "label": "Max Response Tokens",
        "validationEndpoint": "/internal/settings/validate-tokens",
        "defaultValue": 150
      }
    }
  }
}
```

**server/index.ts**

```typescript
import { settings } from '@devvit/web/server';

router.post('/api/generate', async (req, res) => {
  const [apiKey, model, maxTokens] = await Promise.all([
    settings.get('openaiApiKey'),
    settings.get('aiModel'),
    settings.get('maxTokens'),
  ]);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: req.body.messages,
    }),
  });

  const data = await response.json();
  res.json(data);
});
```

### Limitations

- Secrets can only be global
- Secrets can only be set via CLI by app developers
- Setting values are currently not fully surfaced in the CLI
- Maximum of 2KB per setting value

---

## Media Uploads

> **Warning**: Apps can only display images hosted on Reddit

You can upload images to Reddit at runtime using the `media` capability. This is different than static images, which are part of your assets.

Runtime images are useful for embedding images in RTJSON (Posts and Comments) as well as displaying them within an interactive post app.

### Enabling Media Uploads

Enable the `media` permission in your `devvit.json` file.

**devvit.json**

```json
{
  "permissions": {
    "media": true
  }
}
```

### Using Media Uploads

On the server, you can pass the URL of any remotely hosted image (even if its not hosted on Reddit) to the `media.upload` function. The media function will return a Reddit URL.

**server/index.ts**

```typescript
import { media } from '@devvit/media';

function submitImage() {
  const response = await media.upload({
    url: 'https://media2.giphy.com/media/xTiN0CNHgoRf1Ha7CM/giphy.gif',
    type: 'gif',
  });
}
```

### Limitations

Supported file types are:

- GIF
- PNG
- JPEG

Maximum size is 20 MB.

---

## Reddit API Overview

The Reddit API allows you to read and write Reddit content such as posts / comments / upvotes, in order to integrate your app's behavior with the content of the community it's installed in.

### The Reddit Client

Here's how to obtain a reference to the Reddit client:

**devvit.json**

```json
{
  "permissions": {
    "reddit": true
  }
}
```

**server/index.ts**

```typescript
import { reddit } from '@devvit/reddit';
```

### Example Usage

#### Submitting a Post

```typescript
import { Devvit } from '@devvit/public-api';
import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    userGeneratedContent: {
      text: 'Hello there! This is a post from a Devvit app',
    },
    subredditName: subredditName,
    title: 'New Post',
    splash: { appDisplayName: 'Test App' },
  });
};
```

#### Submitting a Comment

```typescript
import { context, reddit } from '@devvit/web/server';

export const createComment = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  reddit.submitComment({
    postId: 't3_123456', // Replace with the actual post ID
    text: 'This is a comment from a Devvit app',
    runAs: 'USER', // Optional: specify the user to run as
  });
};
```
