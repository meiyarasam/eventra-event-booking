import { prisma, isDatabaseConnected } from '../../config/database';
import { devFallbackStore } from '../../config/dev-fallback-store';
import { EventStatus, BookingStatus } from '@eventra/shared';

export interface GenerateDescriptionInput {
  title: string;
  categoryName?: string;
  venueName?: string;
  city?: string;
  isOnline?: boolean;
  highlights?: string;
  targetAudience?: string;
}

export interface ParsedSearchFilters {
  search?: string;
  category?: string;
  city?: string;
  timeframe?: 'all' | 'today' | 'tomorrow' | 'this_weekend' | 'upcoming';
  minPrice?: number;
  maxPrice?: number;
  freeOnly?: boolean;
  isOnline?: boolean;
  interpretedSummary: string;
}

export class AIService {
  private get apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  }

  /**
   * Helper to invoke Google Generative AI REST endpoint
   */
  private async callGemini(prompt: string, systemInstruction?: string): Promise<string | null> {
    const key = this.apiKey;
    if (!key) return null;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      const payload: any = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini API error (${response.status}):`, errorText);
        return null;
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? text.trim() : null;
    } catch (err: any) {
      console.warn('Gemini request failed:', err.message);
      return null;
    }
  }

  /**
   * Feature A: AI Event Description Writer
   */
  async generateEventDescription(input: GenerateDescriptionInput): Promise<string> {
    const prompt = `Write a professional, compelling, and engaging event description for:
Event Title: "${input.title}"
Category: ${input.categoryName || 'General Event'}
Location: ${input.isOnline ? 'Online / Virtual Webinar' : `${input.venueName || 'Main Venue'}, ${input.city || 'City Center'}`}
Target Audience: ${input.targetAudience || 'Professionals, enthusiasts, and community members'}
Key Highlights: ${input.highlights || 'Keynote presentations, interactive networking sessions, and collaborative discussions'}

Requirements:
- 2 to 3 well-written paragraphs with professional marketing tone.
- Emphasize the core value, learning or entertainment experience.
- Include a "What You Will Experience" bullet point list with 3-4 highlights.
- Conclude with a warm call to reserve passes early.
- Do not invent fictitious dates or phone numbers.`;

    const aiResult = await this.callGemini(prompt);
    if (aiResult) {
      return aiResult;
    }

    // High quality deterministic fallback generator
    const locationText = input.isOnline
      ? 'hosted virtually with live interactive streaming'
      : `taking place live at ${input.venueName || 'our selected venue'}${input.city ? `, in ${input.city}` : ''}`;

    const highlightsList = input.highlights
      ? input.highlights.split(',').map((h) => `• ${h.trim()}`).join('\n')
      : `• Expert keynote presentations and practical insights\n• Direct peer networking and interactive Q&A sessions\n• Digital passes and exclusive attendee materials`;

    return `Join us for "${input.title}", a premier ${input.categoryName || 'experience'} ${locationText}. Tailored specifically for ${input.targetAudience || 'enthusiasts and forward-thinking professionals'}, this event delivers an unparalleled atmosphere for discovery, skill-building, and high-impact connection.

What to Expect:
${highlightsList}

Whether you are looking to stay at the cutting edge of your field, connect with top industry peers, or enjoy a world-class gathering, "${input.title}" is designed to exceed expectations. Reserve your pass now to guarantee admission and receive real-time schedule updates.`;
  }

  /**
   * Feature B: Natural-Language Event Search Parser
   */
  async parseNaturalLanguageSearch(query: string): Promise<ParsedSearchFilters> {
    const cleaned = query.trim();

    // 1. Try Gemini parsing if available
    const key = this.apiKey;
    if (key) {
      const prompt = `You are a search query interpreter for EVENTRA, an event ticketing and discovery platform.
Parse the following user search query and extract structured event search filters in JSON format:
User query: "${cleaned}"

JSON format schema to return ONLY (do not include markdown formatting or backticks):
{
  "search": "relevant text query keywords or empty string",
  "category": "technology | music | business | education | arts-culture or empty string",
  "city": "extracted city name or empty string",
  "timeframe": "all | today | tomorrow | this_weekend | upcoming",
  "minPrice": number or null,
  "maxPrice": number or null,
  "freeOnly": boolean,
  "isOnline": boolean or null,
  "interpretedSummary": "one sentence summary of the search intent"
}`;

      const aiText = await this.callGemini(prompt);
      if (aiText) {
        try {
          const jsonText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(jsonText);
          return {
            search: parsed.search || undefined,
            category: parsed.category || undefined,
            city: parsed.city || undefined,
            timeframe: parsed.timeframe || undefined,
            minPrice: parsed.minPrice !== null ? Number(parsed.minPrice) : undefined,
            maxPrice: parsed.maxPrice !== null ? Number(parsed.maxPrice) : undefined,
            freeOnly: Boolean(parsed.freeOnly),
            isOnline: parsed.isOnline !== null ? Boolean(parsed.isOnline) : undefined,
            interpretedSummary: parsed.interpretedSummary || `Searching for "${cleaned}"`,
          };
        } catch {
          // fall through to deterministic
        }
      }
    }

    // 2. Deterministic NLP Pattern Matching Engine
    const lower = cleaned.toLowerCase();
    const result: ParsedSearchFilters = {
      interpretedSummary: `Searching for "${cleaned}"`,
    };

    // Free filter
    if (lower.includes('free') || lower.includes('no cost') || lower.includes('complimentary')) {
      result.freeOnly = true;
    }

    // Price extraction: under 500, under ₹500, below 1000, max 200
    const priceUnderMatch = lower.match(/(?:under|below|less than|max(?:imum)?)\s*(?:₹|rs\.?|inr|\$)?\s*(\d+)/i);
    if (priceUnderMatch) {
      result.maxPrice = parseInt(priceUnderMatch[1], 10);
    }
    const priceBetweenMatch = lower.match(/(?:between|from)\s*(?:₹|rs\.?|inr|\$)?\s*(\d+)\s*(?:to|and|-)\s*(?:₹|rs\.?|inr|\$)?\s*(\d+)/i);
    if (priceBetweenMatch) {
      result.minPrice = parseInt(priceBetweenMatch[1], 10);
      result.maxPrice = parseInt(priceBetweenMatch[2], 10);
    }

    // Timeframe extraction
    if (lower.includes('today') || lower.includes('tonight')) {
      result.timeframe = 'today';
    } else if (lower.includes('tomorrow')) {
      result.timeframe = 'tomorrow';
    } else if (lower.includes('weekend') || lower.includes('this saturday') || lower.includes('this sunday')) {
      result.timeframe = 'this_weekend';
    } else if (lower.includes('upcoming') || lower.includes('next week') || lower.includes('next month') || lower.includes('soon')) {
      result.timeframe = 'upcoming';
    }

    // Category extraction
    if (lower.includes('tech') || lower.includes('software') || lower.includes('ai') || lower.includes('machine learning') || lower.includes('developer') || lower.includes('coding')) {
      result.category = 'technology';
    } else if (lower.includes('music') || lower.includes('concert') || lower.includes('symphony') || lower.includes('acoustic') || lower.includes('live band')) {
      result.category = 'music';
    } else if (lower.includes('business') || lower.includes('finance') || lower.includes('networking') || lower.includes('startup') || lower.includes('pitch')) {
      result.category = 'business';
    } else if (lower.includes('workshop') || lower.includes('education') || lower.includes('masterclass') || lower.includes('training') || lower.includes('seminar')) {
      result.category = 'education';
    } else if (lower.includes('art') || lower.includes('culture') || lower.includes('theater') || lower.includes('exhibit')) {
      result.category = 'arts-culture';
    }

    // Known cities dictionary
    const knownCities = [
      'new york', 'san francisco', 'chicago', 'los angeles', 'austin', 'seattle',
      'london', 'berlin', 'coimbatore', 'chennai', 'bangalore', 'mumbai', 'delhi', 'hyderabad'
    ];
    for (const city of knownCities) {
      if (lower.includes(city)) {
        // Capitalize words
        result.city = city.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }

    // Online / Virtual
    if (lower.includes('online') || lower.includes('virtual') || lower.includes('webinar') || lower.includes('remote')) {
      result.isOnline = true;
    }

    // Extracted search keywords without filler words
    const stripped = lower
      .replace(/\b(find|show|me|events?|workshops?|conferences?|near|in|at|this|next|under|free|paid|for|tickets?)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (stripped.length > 2) {
      result.search = stripped;
    }

    // Generate descriptive summary
    const parts: string[] = [];
    if (result.freeOnly) parts.push('Free');
    if (result.category) parts.push(result.category.toUpperCase());
    parts.push('events');
    if (result.city) parts.push(`in ${result.city}`);
    if (result.timeframe) parts.push(`(${result.timeframe.replace('_', ' ')})`);
    if (result.maxPrice) parts.push(`under ₹${result.maxPrice}`);

    result.interpretedSummary = parts.length > 1 ? `Filtering for ${parts.join(' ')}` : `Searching for "${cleaned}"`;

    return result;
  }

  /**
   * Feature C: Personalized Event Recommendations
   */
  async getRecommendations(userId?: string): Promise<any[]> {
    let activeEvents: any[] = [];
    let userBookmarks: string[] = [];
    let userBookedCategoryIds: string[] = [];

    if (isDatabaseConnected) {
      try {
        activeEvents = await prisma.event.findMany({
          where: {
            status: EventStatus.PUBLISHED,
            startDate: { gte: new Date() },
          },
          include: {
            category: true,
            ticketTypes: { orderBy: { price: 'asc' } },
            organizer: { select: { name: true, email: true } },
            _count: { select: { bookings: true } },
          },
          take: 12,
        });

        if (userId) {
          const [saved, bookings] = await Promise.all([
            prisma.savedEvent.findMany({
              where: { userId },
              select: { eventId: true },
            }),
            prisma.booking.findMany({
              where: { userId, status: BookingStatus.CONFIRMED },
              select: { event: { select: { categoryId: true } } },
            }),
          ]);
          userBookmarks = saved.map((s) => s.eventId);
          userBookedCategoryIds = bookings.map((b) => b.event.categoryId).filter(Boolean);
        }
      } catch {
        await devFallbackStore.init();
        activeEvents = devFallbackStore.events.filter((e) => e.status === EventStatus.PUBLISHED);
      }
    } else {
      await devFallbackStore.init();
      activeEvents = devFallbackStore.events.filter((e) => e.status === EventStatus.PUBLISHED);
    }

    // Score and rank events
    const scored = activeEvents.map((ev) => {
      let score = 50; // base score
      let reason = 'Trending upcoming event on EVENTRA';

      if (userBookmarks.includes(ev.id)) {
        score += 40;
        reason = 'Based on your saved events';
      } else if (userBookedCategoryIds.includes(ev.categoryId)) {
        score += 30;
        reason = `Recommended because you enjoy ${ev.category?.name || 'this category'}`;
      } else if ((ev._count?.bookings || 0) > 3) {
        score += 20;
        reason = 'Popular choice among attendees this week';
      } else if (ev.city === 'San Francisco' || ev.city === 'New York' || ev.city === 'London') {
        score += 15;
        reason = `Top rated in ${ev.city}`;
      }

      const minPrice = ev.ticketTypes && ev.ticketTypes.length > 0
        ? Math.min(...ev.ticketTypes.map((t: any) => Number(t.price)))
        : 0;

      return {
        id: ev.id,
        title: ev.title,
        slug: ev.slug,
        bannerUrl: ev.bannerUrl,
        startDate: ev.startDate instanceof Date ? ev.startDate.toISOString() : ev.startDate,
        venueName: ev.venueName,
        city: ev.city,
        isOnline: ev.isOnline,
        category: ev.category,
        minPrice,
        score,
        recommendationReason: reason,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6);
  }

  /**
   * Feature D: AI Event Chatbot
   */
  async chat(
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }> = [],
    userId?: string
  ): Promise<{ response: string; suggestions?: string[] }> {
    const trimmed = message.trim();

    // 1. Gather live platform knowledge
    let upcomingEventsSnippet = '';
    let userBookingsSnippet = '';

    if (isDatabaseConnected) {
      try {
        const events = await prisma.event.findMany({
          where: { status: EventStatus.PUBLISHED, startDate: { gte: new Date() } },
          select: { title: true, city: true, startDate: true, isOnline: true, category: { select: { name: true } } },
          take: 8,
          orderBy: { startDate: 'asc' },
        });
        upcomingEventsSnippet = events
          .map((e) => `• "${e.title}" (${e.category?.name || 'Event'}), ${e.isOnline ? 'Online' : e.city}, Date: ${new Date(e.startDate).toLocaleDateString()}`)
          .join('\n');

        if (userId) {
          const myBookings = await prisma.booking.findMany({
            where: { userId },
            select: { bookingReference: true, status: true, event: { select: { title: true } } },
            take: 3,
          });
          if (myBookings.length > 0) {
            userBookingsSnippet = myBookings
              .map((b) => `• Ref: ${b.bookingReference} for "${b.event.title}" [Status: ${b.status}]`)
              .join('\n');
          }
        }
      } catch {
        await devFallbackStore.init();
        upcomingEventsSnippet = devFallbackStore.events
          .slice(0, 5)
          .map((e) => `• "${e.title}" (${e.category?.name || 'Event'}), ${e.city}`)
          .join('\n');
      }
    } else {
      await devFallbackStore.init();
      upcomingEventsSnippet = devFallbackStore.events
        .slice(0, 5)
        .map((e) => `• "${e.title}" (${e.category?.name || 'Event'}), ${e.city}`)
        .join('\n');
    }

    const systemPrompt = `You are the official EVENTRA AI Event Assistant.
EVENTRA is a modern event discovery, ticketing, and attendee pass platform.

Live Platform Data Grounding:
Currently Featured Events:
${upcomingEventsSnippet || '• Global Software Architecture Summit\n• NextGen AI & Cloud Infrastructure Expo\n• Neon Nights Symphony'}

${userBookingsSnippet ? `User's Active Bookings:\n${userBookingsSnippet}` : ''}

Key Platform Rules & Guidance:
1. Event Discovery: Users can explore events, filter by Category, City, Price (Free or Paid), and Date at /events.
2. Booking & QR Passes: After booking, digital passes with QR codes are generated immediately and sent to the user's verified email address. Passes can also be downloaded from /bookings.
3. Verification: New users must verify their email with a 6-digit OTP code or link to access bookings.
4. Cancellation: Organizers can cancel their events (with full simulated refunds and in-app attendee notices). Attendees can cancel bookings up to 48 hours prior to start time.
5. Answer concisely, helpfully, and enthusiastically. Use Markdown formatting. Never fabricate events not listed on EVENTRA.`;

    // 2. Try Gemini first if key available
    if (this.apiKey) {
      const historyContext = history.slice(-4).map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
      const fullPrompt = `${historyContext ? `Previous context:\n${historyContext}\n\n` : ''}User asks: "${trimmed}"\nAssistant:`;

      const aiReply = await this.callGemini(fullPrompt, systemPrompt);
      if (aiReply) {
        return {
          response: aiReply,
          suggestions: ['Explore upcoming events', 'How do QR passes work?', 'Check my bookings'],
        };
      }
    }

    // 3. Deterministic Knowledge Grounded Assistant Fallback
    const lower = trimmed.toLowerCase();

    if (lower.includes('ticket') || lower.includes('pass') || lower.includes('qr') || lower.includes('entry')) {
      return {
        response: `**Accessing Your Digital Passes & QR Codes:**\n\n1. Complete your booking on any event page.\n2. Once confirmed, you will receive a confirmation email with embedded QR codes.\n3. You can also view and download all your passes anytime from the **[My Bookings](/bookings)** dashboard.\n4. Present the QR code on your mobile device at the venue entrance for seamless check-in.`,
        suggestions: ['Go to My Bookings', 'How do I cancel a ticket?', 'Explore Events'],
      };
    }

    if (lower.includes('cancel') || lower.includes('refund')) {
      return {
        response: `**Cancellation & Refund Policy:**\n\n• **For Attendees:** You can cancel confirmed bookings up to 48 hours before the event start time directly from **[My Bookings](/bookings)**. Capacity is automatically returned to the ticketing pool.\n• **For Organizers:** Event owners can cancel events through the Organizer Dashboard with a specified reason. All confirmed attendees receive instant in-app notices and cancellation emails.`,
        suggestions: ['View cancellation policy', 'Manage my bookings', 'Organizer Dashboard'],
      };
    }

    if (lower.includes('verif') || lower.includes('email') || lower.includes('otp') || lower.includes('code')) {
      return {
        response: `**Email Verification Guide:**\n\nWhen registering for EVENTRA, an automated verification message is dispatched to your email address with a 6-digit security code and direct verification link.\n\n• Enter the code at **[Verify Email](/verify-email)** to unlock pass downloads.\n• If the code expired, click "Resend Code" to trigger a fresh OTP.`,
        suggestions: ['Verify my email now', 'Resend verification code', 'Sign in'],
      };
    }

    if (lower.includes('find') || lower.includes('search') || lower.includes('event') || lower.includes('concert') || lower.includes('tech')) {
      return {
        response: `**Discovering Events on EVENTRA:**\n\nYou can discover summits, music festivals, tech masterclasses, and executive galas at **[Explore Events](/events)**.\n\n**Currently Trending on EVENTRA:**\n${upcomingEventsSnippet}\n\nTry filtering by your preferred city, date range (Today, Tomorrow, This Weekend), or ticket price!`,
        suggestions: ['Show tech workshops', 'Show free events', 'Filter by city'],
      };
    }

    if (lower.includes('organizer') || lower.includes('host') || lower.includes('create event')) {
      return {
        response: `**Hosting Events on EVENTRA:**\n\nTo host events, navigate to **[Become an Organizer](/organizer/request)** to submit your organization details. Once verified by our administration team, you gain access to the Organizer Studio to build events, define multi-tier tickets, view real-time sales analytics, and scan attendee QR codes.`,
        suggestions: ['Apply for organizer access', 'View organizer studio', 'Admin overview'],
      };
    }

    return {
      response: `Hello! I am your **EVENTRA Assistant**. I can help you find events, explain ticket tiers, guide you through email verification, or answer questions about your booked passes.\n\n**Quick shortcuts:**\n• Browse our catalog: **[Explore Events](/events)**\n• Check your passes: **[My Bookings](/bookings)**\n• Contact administration: **[About Page](/about)**`,
      suggestions: ['Find upcoming events', 'How do QR tickets work?', 'Verify my account'],
    };
  }
}

export const aiService = new AIService();
