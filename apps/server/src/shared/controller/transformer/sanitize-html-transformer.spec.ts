import { plainToClass } from 'class-transformer';
import { SanitizeHtml } from './sanitize-html.transformer';

describe('SanitizeHtmlTransformer Decorator', () => {
	class WithHtmlDto {
		@SanitizeHtml()
		title!: string;

		@SanitizeHtml({ keep: 'inline' })
		excerpt?: string;

		@SanitizeHtml({ keep: 'richtext' })
		content!: string;
	}

	describe('when fully sanitizing an input string', () => {
		it('should remove all html', () => {
			const plainString = { title: '<b>html text</b>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.title).toEqual('html text');
		});
	});

	describe('when sanitizing everything but inline tags', () => {
		it('should remove all html', () => {
			const plainString = { excerpt: '<h1><b>html text</b></h1>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.excerpt).toEqual('<b>html text</b>');
		});
	});

	describe('when sanitizing everything but richtext tags', () => {
		it('should remove all html', () => {
			const plainString = { content: '<h1><b>html text</b></h1><script>alert("foobar");</script><style></style>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.content).toEqual('<h1><b>html text</b></h1>');
		});
	});

	it('should allow optional properties', () => {
		const instance = plainToClass(WithHtmlDto, { title: 'title', content: 'content' });
		expect(instance.excerpt).toBe(undefined);
	});
});
