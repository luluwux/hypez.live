import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize decorator for automatic XSS protection
 * Strips dangerous HTML tags while preserving safe formatting
 */
export function Sanitize() {
    return Transform(({ value }) => {
        if (typeof value !== 'string') {
            return value;
        }

        return sanitizeHtml(value, {
            allowedTags: [
                'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
                'a', 'span', 'div'
            ],
            allowedAttributes: {
                'a': ['href', 'title', 'target'],
                'span': ['class'],
                'div': ['class']
            },
            allowedSchemes: ['http', 'https', 'mailto'],
            // Remove all event handlers (onclick, onerror, etc.)
            disallowedTagsMode: 'discard',
            // Strip all scripts and dangerous content
            allowedClasses: {},
        });
    });
}
