import { useEffect } from 'react';
import { Shield } from 'lucide-react';

export default function Privacy() {
  useEffect(() => { document.title = 'Privacy Policy — DeepGuard'; }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-24 pb-16">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Privacy Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026</p>

          <div className="prose prose-invert prose-sm max-w-none space-y-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>1. Data We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">When you use DeepGuard, we collect minimal data necessary to provide our services. This includes: files you upload for detection (temporarily processed and immediately deleted), basic usage analytics (page views, feature usage), and account information if you register (email address, display name). We use browser fingerprinting solely for anonymous usage quota enforcement.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>2. How We Use Your Data</h2>
              <p className="text-muted-foreground leading-relaxed">Uploaded files are processed exclusively for deepfake detection and are deleted immediately after analysis. We do not store, review, or use your uploaded content for training AI models. Detection results are stored in your account history if you are logged in, and can be deleted at any time. Anonymous users' results are not stored beyond the current session.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>3. Data Storage & Security</h2>
              <p className="text-muted-foreground leading-relaxed">All file processing occurs in isolated, encrypted environments. Files are transmitted via HTTPS and stored temporarily in encrypted cloud storage (AWS S3) during processing only. We implement industry-standard security measures including encryption at rest and in transit, access controls, and regular security audits.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>4. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">For multi-engine detection, uploaded images may be sent to third-party detection APIs (SightEngine, Illuminarty) for analysis. These services process files transiently and do not retain your content. We also use analytics services to understand platform usage patterns. No personal data is shared with advertisers.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>5. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">You have the right to: access your personal data, request deletion of your account and associated data, export your detection history, opt out of analytics tracking, and withdraw consent at any time. To exercise any of these rights, contact us at privacy@deepguard.org.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>6. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">We use essential cookies for authentication and session management. We use anonymous analytics cookies to understand usage patterns. We do not use advertising cookies or tracking pixels. You can disable non-essential cookies in your browser settings.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>7. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">For privacy-related inquiries: <a href="mailto:privacy@deepguard.org" className="text-primary hover:underline">privacy@deepguard.org</a></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
