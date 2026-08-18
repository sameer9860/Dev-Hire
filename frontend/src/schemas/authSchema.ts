import { z } from 'zod';
import type { ChangeEvent, KeyboardEvent } from 'react';

const noSpaceMsg = (label: string) => `${label} cannot contain spaces`;

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'gmx.net',
  'hey.com',
]);

export function isCompanyEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return Boolean(domain) && !FREE_EMAIL_DOMAINS.has(domain);
}

export const PASSWORD_RULES_HELP =
  'Min 8 chars, with uppercase, lowercase, number, and special character. Letters, numbers, and special characters only — no spaces or emojis. Cannot include your username.';

export const PASSWORD_CHARSET_ERROR =
  'Only uppercase, lowercase, numbers, and special characters are allowed.';

export const USERNAME_CHARSET_ERROR =
  'Only uppercase, lowercase, numbers, and special characters are allowed.';

/** Printable ASCII except space — blocks emojis, unicode, and other symbols. */
export const ALLOWED_PASSWORD_CHARS = /^[\x21-\x7E]+$/;

function passwordCharsetSchema(minLength = 1) {
  return z
    .string()
    .refine((v) => !v || ALLOWED_PASSWORD_CHARS.test(v), PASSWORD_CHARSET_ERROR)
    .min(minLength, minLength <= 1 ? 'Password is required' : `Password must be at least ${minLength} characters`)
    .regex(/^\S+$/, noSpaceMsg('Password'));
}

/** True when password contains / is based on username (e.g. asdf → Asdf@123). */
export function passwordRelatedToUsername(password: string, username?: string) {
  if (!password || !username) return false;
  const u = username.toLowerCase().trim();
  const p = password.toLowerCase();
  if (u.length < 3) return p === u;
  if (p.includes(u)) return true;
  const uAlnum = u.replace(/[^a-z0-9]/g, '');
  const pAlnum = p.replace(/[^a-z0-9]/g, '');
  return Boolean(uAlnum && uAlnum.length >= 3 && pAlnum.includes(uAlnum));
}

/** Strong password used for register + change password (not login). */
export function strongPasswordSchema(username?: string) {
  return z
    .string()
    .refine((v) => !v || ALLOWED_PASSWORD_CHARS.test(v), PASSWORD_CHARSET_ERROR)
    .min(8, 'Password must be at least 8 characters')
    .regex(/^\S+$/, noSpaceMsg('Password'))
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[a-z]/, 'Include at least one lowercase letter')
    .regex(/\d/, 'Include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Include at least one special character')
    .refine((password) => !passwordRelatedToUsername(password, username), {
      message: 'Password cannot be the same as or based on your username',
    });
}

export const loginSchema = z.object({
  username: z
    .string()
    .refine((v) => !v || ALLOWED_PASSWORD_CHARS.test(v), USERNAME_CHARSET_ERROR)
    .min(3, 'Username must be at least 3 characters')
    .regex(/^\S+$/, noSpaceMsg('Username')),
  // Login rejects spaces, emojis, and other non-ASCII — strength enforced at register/change
  password: passwordCharsetSchema(1),
});

const usernameField = z
  .string()
  .refine((v) => !v || ALLOWED_PASSWORD_CHARS.test(v), USERNAME_CHARSET_ERROR)
  .min(3, 'Minimum 3 characters')
  .max(50)
  .regex(/^\S+$/, noSpaceMsg('Username'));

const emailField = z
  .string()
  .email('Enter a valid email address')
  .regex(/^\S+$/, noSpaceMsg('Email'));

function withMatchingPasswords<
  T extends z.ZodType<{ password: string; password2: string; username?: string }>,
>(schema: T) {
  return schema
    .superRefine((data, ctx) => {
      const pwd = strongPasswordSchema(data.username).safeParse(data.password);
      if (!pwd.success) {
        for (const issue of pwd.error.issues) {
          ctx.addIssue({ ...issue, path: ['password'] });
        }
      }
      if (data.password !== data.password2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords don't match",
          path: ['password2'],
        });
      }
    });
}

export const developerRegisterSchema = withMatchingPasswords(
  z.object({
    username: usernameField,
    email: emailField,
    password: z.string(),
    password2: z.string().regex(/^\S*$/, noSpaceMsg('Password')).regex(/^$|^[\x21-\x7E]+$/, PASSWORD_CHARSET_ERROR),
    role: z.literal('developer'),
  })
);

export const companyRegisterSchema = withMatchingPasswords(
  z.object({
    username: usernameField,
    email: emailField,
    password: z.string(),
    password2: z.string().regex(/^\S*$/, noSpaceMsg('Password')).regex(/^$|^[\x21-\x7E]+$/, PASSWORD_CHARSET_ERROR),
    role: z.literal('company'),
    company_name: z
      .string()
      .min(1, 'Company name is required')
      .regex(/^\S+$/, noSpaceMsg('Company name')),
    company_website: z
      .string()
      .regex(/^\S*$/, noSpaceMsg('Website'))
      .optional()
      .refine((v) => {
        if (!v) return true;
        const valToTest = v.includes('://') ? v : `https://${v}`;
        return z.string().url().safeParse(valToTest).success;
      }, {
        message: 'Enter a valid URL',
      }),
  })
).superRefine((data, ctx) => {
  if (!isCompanyEmail(data.email)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use a company email (not Gmail, Yahoo, Outlook, etc.)',
      path: ['email'],
    });
  }
});

/** @deprecated use developerRegisterSchema / companyRegisterSchema */
export const registerSchema = withMatchingPasswords(
  z.object({
    username: usernameField,
    email: emailField,
    password: z.string(),
    password2: z.string(),
    role: z.enum(['developer', 'company']),
    company_name: z.string().regex(/^\S*$/, noSpaceMsg('Company name')).optional(),
    company_website: z
      .string()
      .regex(/^\S*$/, noSpaceMsg('Website'))
      .optional()
      .refine((v) => {
        if (!v) return true;
        const valToTest = v.includes('://') ? v : `https://${v}`;
        return z.string().url().safeParse(valToTest).success;
      }, {
        message: 'Enter a valid URL',
      }),
  })
)
  .superRefine((data, ctx) => {
    if (data.role === 'company' && !data.company_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company name is required',
        path: ['company_name'],
      });
    }
    if (data.role === 'company' && !isCompanyEmail(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use a company email (not Gmail, Yahoo, Outlook, etc.)',
        path: ['email'],
      });
    }
  });

export function createChangePasswordSchema(username: string) {
  return z
    .object({
      current_password: passwordCharsetSchema(1),
      new_password: z.string(),
      new_password2: z.string().regex(/^\S*$/, noSpaceMsg('Password')).regex(/^$|^[\x21-\x7E]+$/, PASSWORD_CHARSET_ERROR),
    })
    .superRefine((data, ctx) => {
      const pwd = strongPasswordSchema(username).safeParse(data.new_password);
      if (!pwd.success) {
        for (const issue of pwd.error.issues) {
          ctx.addIssue({ ...issue, path: ['new_password'] });
        }
      }
      if (data.new_password !== data.new_password2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords don't match",
          path: ['new_password2'],
        });
      }
    });
}

export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required to delete your account')
    .regex(/^\S+$/, noSpaceMsg('Password')),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type DeveloperRegisterFormData = z.infer<typeof developerRegisterSchema>;
export type CompanyRegisterFormData = z.infer<typeof companyRegisterSchema>;
export type ChangePasswordFormData = z.infer<ReturnType<typeof createChangePasswordSchema>>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

type RegisterReturn = {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: ChangeEvent<HTMLInputElement>) => void;
  ref: React.Ref<HTMLInputElement>;
  name: string;
};

/** Block typing/pasting spaces in auth inputs. */
export function noSpaceField(registerProps: RegisterReturn) {
  return {
    ...registerProps,
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === ' ' || e.code === 'Space') e.preventDefault();
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.replace(/\s/g, '');
      registerProps.onChange(e);
    },
  };
}

/** Block spaces; keep other invalid characters so the charset error can display. */
export function passwordCharsetField(
  registerProps: RegisterReturn,
  trigger?: (name: any) => unknown,
) {
  return {
    ...registerProps,
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === ' ' || e.code === 'Space') e.preventDefault();
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.replace(/\s/g, '');
      const value = e.target.value;
      const invalid = Boolean(value) && !ALLOWED_PASSWORD_CHARS.test(value);
      const wasInvalid = e.target.dataset.charsetInvalid === '1';
      registerProps.onChange(e);
      if (invalid || wasInvalid) {
        void trigger?.(registerProps.name);
      }
      e.target.dataset.charsetInvalid = invalid ? '1' : '0';
    },
  };
}
