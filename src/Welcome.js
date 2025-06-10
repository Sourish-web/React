
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function WelcomePage() {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  // Add hover effects for buttons and links
  useEffect(() => {
    const buttons = document.querySelectorAll("button");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", () => {
        if (button.style.backgroundColor === "#ffffff" || button.style.backgroundColor === "rgb(255, 255, 255)") {
          button.style.backgroundColor = "#f3f4f6";
          button.style.transform = "translateY(-2px)";
          button.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
        } else {
          button.style.backgroundColor = "#4338ca";
          button.style.transform = "translateY(-1px)";
          button.style.boxShadow = "0 4px 8px rgba(79, 70, 229, 0.4)";
        }
      });
      button.addEventListener("mouseleave", () => {
        if (button.style.backgroundColor === "#f3f4f6" || button.style.backgroundColor === "rgb(243, 244, 246)") {
          button.style.backgroundColor = "#ffffff";
          button.style.transform = "translateY(0)";
          button.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
        } else {
          button.style.backgroundColor = "#4f46e5";
          button.style.transform = "translateY(0)";
          button.style.boxShadow = "0 2px 5px rgba(79, 70, 229, 0.3)";
        }
      });
    });

    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        link.style.color = "#ffffff";
      });
      link.addEventListener("mouseleave", () => {
        link.style.color = "#9ca3af";
      });
    });

    // Add animation for progress bar
    const progressFill = document.querySelector(".progress-fill");
    if (progressFill) {
      progressFill.style.width = "0%";
      setTimeout(() => {
        progressFill.style.width = "60%";
      }, 300);
    }

    // Add hover effects for transaction items
    const transactionItems = document.querySelectorAll(".transaction-item");
    transactionItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        item.style.backgroundColor = "#f1f5f9";
        item.style.transform = "translateX(5px)";
      });
      item.addEventListener("mouseleave", () => {
        item.style.backgroundColor = "transparent";
        item.style.transform = "translateX(0)";
      });
    });
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <h1 style={styles.logo}>ExpenseMate</h1>
          <p style={styles.tagline}>Smart Finance Management</p>
        </div>
        <button style={styles.loginButton} onClick={handleLoginRedirect}>
          Login / Sign Up
        </button>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h2 style={styles.heroTitle}>Master Your Money with Ease</h2>
          <p style={styles.heroSubtitle}>
            Track expenses, set budgets, and achieve financial freedom with our intuitive
            personal finance platform.
          </p>
          <div style={styles.ctaContainer}>
            <button style={styles.ctaButton} onClick={handleLoginRedirect}>
              Get Started - It's Free
            </button>
            <p style={styles.ctaNote}>No credit card required</p>
          </div>
          <div style={styles.trustBadges}>
            <div style={styles.badge}>🏆 Trusted by 50,000+ users</div>
            <div style={styles.badge}>🔒 Bank-level security</div>
          </div>
        </div>
        <div style={styles.heroScreenshot}>
          <div style={styles.dashboardHeader}>
            <h3 style={styles.dashboardLogo}>ExpenseMate</h3>
          </div>
          <div style={styles.dashboardContent}>
            <div style={styles.expenseSummary}>
              <h4 style={styles.summaryTitle}>Total Expenses</h4>
              <p style={styles.summaryAmount}>₹500000</p>
              <p style={styles.summaryPeriod}>This Month</p>
            </div>
            <div style={styles.budgetProgress}>
              <p style={styles.progressTitle}>Budget Progress</p>
              <div style={styles.progressBar}>
                <div style={styles.progressFill} className="progress-fill"></div>
              </div>
              <p style={styles.progressText}>60% of ₹1,70,000 budget used</p>
            </div>
            <div style={styles.transactions}>
              <p style={styles.transactionsTitle}>Recent Transactions</p>
              <ul style={styles.transactionList}>
                <li style={styles.transactionItem} className="transaction-item">
                  <span style={styles.transactionIcon}>🛒</span>
                  <span>Grocery Store</span>
                  <span style={styles.transactionAmount}>−₹7,242.00</span>
                </li>
                <li style={styles.transactionItem} className="transaction-item">
                  <span style={styles.transactionIcon}>☕</span>
                  <span>Coffee Shop</span>
                  <span style={styles.transactionAmount}>−₹1,062.50</span>
                </li>
                <li style={styles.transactionItem} className="transaction-item">
                  <span style={styles.transactionIcon}>💼</span>
                  <span>Salary</span>
                  <span style={{ ...styles.transactionAmount, color: "#10b981" }}>+₹2,55,000.00</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the sections (unchanged) */}
      {/* Features Section */}
      <section style={styles.features}>
        <h3 style={styles.sectionTitle}>Powerful Features</h3>
        <p style={styles.sectionSubtitle}>
          Everything you need to take control of your finances
        </p>
        <div style={styles.featuresGrid}>
          <div style={styles.featureItem}>
            <div style={styles.featureIcon}>📊</div>
            <h4 style={styles.featureTitle}>Expense Tracking</h4>
            <p style={styles.featureText}>
              Automatically categorize transactions and see where your money goes with
              beautiful visualizations.
            </p>
          </div>
          <div style={styles.featureItem}>
            <div style={styles.featureIcon}>💰</div>
            <h4 style={styles.featureTitle}>Smart Budgeting</h4>
            <p style={styles.featureText}>
              Set monthly budgets and get alerts before you overspend. Our AI learns your
              habits to make better suggestions.
            </p>
          </div>
          <div style={styles.featureItem}>
            <div style={styles.featureIcon}>📱</div>
            <h4 style={styles.featureTitle}>Multi-Device Sync</h4>
            <p style={styles.featureText}>
              Access your finances anywhere. Our apps work seamlessly across all your
              devices with real-time sync.
            </p>
          </div>
          <div style={styles.featureItem}>
            <div style={styles.featureIcon}>🔔</div>
            <h4 style={styles.featureTitle}>Bill Reminders</h4>
            <p style={styles.featureText}>
              Never miss a payment again. We'll remind you when bills are due and help you
              plan for upcoming expenses.
            </p>
          </div>
          <div style={styles.featureItem}>
            <div style={styles.featureIcon}>📈</div>
            <h4 style={styles.featureTitle}>Investment Tracking</h4>
            <p style={styles.featureText}>
              Monitor your portfolio performance alongside your regular spending for a
              complete financial picture.
            </p>
          </div>
          <div style={styles.featureItem}>
            <div style={styles.featureIcon}>🤖</div>
            <h4 style={styles.featureTitle}>AI Insights</h4>
            <p style={styles.featureText}>
              Get personalized recommendations to save more and optimize your spending
              patterns.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={styles.howItWorks}>
        <h3 style={styles.sectionTitle}>How ExpenseMate Works</h3>
        <p style={styles.sectionSubtitle}>
          Get started in minutes and see results immediately
        </p>
        <div style={styles.stepsContainer}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h4 style={styles.stepTitle}>Connect Your Accounts</h4>
            <p style={styles.stepText}>
              Securely link your bank, credit cards, and investment accounts (or enter
              manually).
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h4 style={styles.stepTitle}>Set Your Budgets</h4>
            <p style={styles.stepText}>
              Create customized budgets for different spending categories based on your
              goals.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h4 style={styles.stepTitle}>Track & Optimize</h4>
            <p style={styles.stepText}>
              Monitor your progress, get insights, and adjust as needed to reach your
              financial targets.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={styles.testimonials}>
        <h3 style={styles.sectionTitle}>Trusted by Financial Enthusiasts</h3>
        <p style={styles.sectionSubtitle}>
          Join thousands who transformed their financial lives
        </p>
        <div style={styles.testimonialsGrid}>
          <div style={styles.testimonialItem}>
            <div style={styles.testimonialRating}>★★★★★</div>
            <p style={styles.testimonialText}>
              "ExpenseMate helped me pay off ₹12,75,000 in debt in just 8 months. The
              budgeting tools are incredibly intuitive and powerful."
            </p>
            <div style={styles.testimonialAuthor}>
              <div style={styles.authorAvatar}></div>
              <div>
                <p style={styles.authorName}>Sarah K.</p>
                <p style={styles.authorTitle}>Freelance Designer</p>
              </div>
            </div>
          </div>
          <div style={styles.testimonialItem}>
            <div style={styles.testimonialRating}>★★★★★</div>
            <p style={styles.testimonialText}>
              "As a small business owner, keeping personal and business finances separate
              was challenging. ExpenseMate made it simple and saved me hours each week."
            </p>
            <div style={styles.testimonialAuthor}>
              <div style={styles.authorAvatar}></div>
              <div>
                <p style={styles.authorName}>Michael T.</p>
                <p style={styles.authorTitle}>Entrepreneur</p>
              </div>
            </div>
          </div>
          <div style={styles.testimonialItem}>
            <div style={styles.testimonialRating}>★★★★☆</div>
            <p style={styles.testimonialText}>
              "The investment tracking feature is game-changing. I can see all my finances
              in one place and make better decisions about my money."
            </p>
            <div style={styles.testimonialAuthor}>
              <div style={styles.authorAvatar}></div>
              <div>
                <p style={styles.authorName}>Priya R.</p>
                <p style={styles.authorTitle}>Financial Analyst</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={styles.pricing}>
        <h3 style={styles.sectionTitle}>Simple, Transparent Pricing</h3>
        <p style={styles.sectionSubtitle}>
          Start for free, upgrade when you're ready
        </p>
        <div style={styles.pricingCards}>
          <div style={styles.pricingCard}>
            <h4 style={styles.pricingTitle}>Free</h4>
            <p style={styles.pricingPrice}>
              ₹0<span style={styles.pricingPeriod}>/month</span>
            </p>
            <ul style={styles.pricingFeatures}>
              <li style={styles.pricingFeature}>Track expenses & income</li>
              <li style={styles.pricingFeature}>Basic budgeting</li>
              <li style={styles.pricingFeature}>3 account connections</li>
              <li style={styles.pricingFeature}>Email support</li>
            </ul>
            <button style={styles.pricingButton} onClick={handleLoginRedirect}>
              Get Started
            </button>
          </div>
          <div style={styles.pricingCardFeatured}>
            <div style={styles.featuredBadge}>Most Popular</div>
            <h4 style={styles.pricingTitle}>Pro</h4>
            <p style={styles.pricingPrice}>
              ₹849.15<span style={styles.pricingPeriod}>/month</span>
            </p>
            <ul style={styles.pricingFeatures}>
              <li style={styles.pricingFeature}>Everything in Free, plus:</li>
              <li style={styles.pricingFeature}>Unlimited accounts</li>
              <li style={styles.pricingFeature}>Advanced budgeting</li>
              <li style={styles.pricingFeature}>Bill reminders</li>
              <li style={styles.pricingFeature}>Investment tracking</li>
              <li style={styles.pricingFeature}>Priority support</li>
            </ul>
            <button
              style={styles.pricingButtonFeatured}
              onClick={handleLoginRedirect}
            >
              Try 7 Days Free
            </button>
          </div>
          <div style={styles.pricingCard}>
            <h4 style={styles.pricingTitle}>Family</h4>
            <p style={styles.pricingPrice}>
              ₹1,274.15<span style={styles.pricingPeriod}>/month</span>
            </p>
            <ul style={styles.pricingFeatures}>
              <li style={styles.pricingFeature}>Everything in Pro, plus:</li>
              <li style={styles.pricingFeature}>Up to 5 family members</li>
              <li style={styles.pricingFeature}>Shared budgets</li>
              <li style={styles.pricingFeature}>Child accounts</li>
              <li style={styles.pricingFeature}>Family financial reports</li>
            </ul>
            <button style={styles.pricingButton} onClick={handleLoginRedirect}>
              Choose Family
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={styles.faq}>
        <h3 style={styles.sectionTitle}>Frequently Asked Questions</h3>
        <div style={styles.faqGrid}>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>Is my financial data secure?</h4>
            <p style={styles.faqAnswer}>
              Absolutely. We use bank-grade 256-bit encryption and never store your
              banking credentials. Your data is always protected.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>
              Can I use ExpenseMate without linking accounts?
            </h4>
            <p style={styles.faqAnswer}>
              Yes! You can manually enter transactions if you prefer not to connect your
              accounts. All features remain available.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>How does the free trial work?</h4>
            <p style={styles.faqAnswer}>
              The Pro plan offers a 7-day free trial with no credit card required. After 7
              days, you'll be automatically switched to the Free plan unless you upgrade.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>Can I cancel anytime?</h4>
            <p style={styles.faqAnswer}>
              Yes, you can cancel your subscription at any time. You'll retain access
              until the end of your billing period.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>Do you offer student discounts?</h4>
            <p style={styles.faqAnswer}>
              We offer a 50% discount for students with valid .edu email addresses.
              Contact our support team to verify your status.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>How often is data updated?</h4>
            <p style={styles.faqAnswer}>
              Connected accounts typically update within 4-6 hours. You can manually
              refresh at any time for real-time updates.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={styles.finalCta}>
        <div style={styles.finalCtaContent}>
          <h3 style={styles.finalCtaTitle}>Ready to Transform Your Finances?</h3>
          <p style={styles.finalCtaText}>
            Join over 50,000 users who are saving more, spending smarter, and reaching
            their financial goals faster.
          </p>
          <button style={styles.finalCtaButton} onClick={handleLoginRedirect}>
            Start Your Free Trial
          </button>
          <p style={styles.finalCtaNote}>
            No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerColumns}>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerHeading}>ExpenseMate</h4>
            <p style={styles.footerText}>
              The smart way to manage your money and achieve financial freedom.
            </p>
            <div style={styles.socialLinks}>
              <a href="#" style={styles.socialLink}>
                Twitter
              </a>
              <a href="#" style={styles.socialLink}>
                Facebook
              </a>
              <a href="#" style={styles.socialLink}>
                Instagram
              </a>
              <a href="#" style={styles.socialLink}>
                LinkedIn
              </a>
            </div>
          </div>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerHeading}>Product</h4>
            <a href="#" style={styles.footerLink}>
              Features
            </a>
            <a href="#" style={styles.footerLink}>
              Pricing
            </a>
            <a href="#" style={styles.footerLink}>
              Mobile Apps
            </a>
            <a href="#" style={styles.footerLink}>
              Integrations
            </a>
            <a href="#" style={styles.footerLink}>
              Roadmap
            </a>
          </div>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerHeading}>Resources</h4>
            <a href="#" style={styles.footerLink}>
              Blog
            </a>
            <a href="#" style={styles.footerLink}>
              Guides
            </a>
            <a href="#" style={styles.footerLink}>
              Help Center
            </a>
            <a href="#" style={styles.footerLink}>
              Webinars
            </a>
            <a href="#" style={styles.footerLink}>
              API Docs
            </a>
          </div>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerHeading}>Company</h4>
            <a href="#" style={styles.footerLink}>
              About Us
            </a>
            <a href="#" style={styles.footerLink}>
              Careers
            </a>
            <a href="#" style={styles.footerLink}>
              Press
            </a>
            <a href="#" style={styles.footerLink}>
              Contact
            </a>
            <a href="#" style={styles.footerLink}>
              Legal
            </a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.footerCopyright}>
            © 2025 ExpenseMate. All rights reserved.
          </p>
          <div style={styles.footerLegal}>
            <a href="#" style={styles.footerLegalLink}>
              Privacy Policy
            </a>
            <a href="#" style={styles.footerLegalLink}>
              Terms of Service
            </a>
            <a href="#" style={styles.footerLegalLink}>
              Cookie Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    lineHeight: 1.6,
  },
  header: {
    backgroundColor: "#ffffff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    padding: "1.5rem 5%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logoContainer: {
    display: "flex",
    flexDirection: "column",
  },
  logo: {
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#4f46e5",
    margin: 0,
  },
  tagline: {
    fontSize: "0.75rem",
    color: "#6b7280",
    margin: "0.25rem 0 0 0",
    fontWeight: 500,
    letterSpacing: "0.05em",
  },
  loginButton: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    boxShadow: "0 2px 5px rgba(79, 70, 229, 0.3)",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6rem 5%",
    backgroundColor: "#f9fafb",
    backgroundImage:
      "radial-gradient(circle at 10% 20%, rgba(233, 213, 255, 0.5) 0%, rgba(219, 234, 254, 0.5) 90%)",
  },
  heroContent: {
    maxWidth: "600px",
    textAlign: "left",
  },
  heroScreenshot: {
    width: "40%",
    height: "450px",
    background: "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)",
    borderRadius: "16px",
    boxShadow: "0 12px 24px rgba(0,0,0,0.15), 0 4px 8px rgba(79, 70, 229, 0.2)",
    border: "1px solid rgba(79, 70, 229, 0.1)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  dashboardHeader: {
    background: "linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)",
    padding: "1rem 1.5rem",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  dashboardLogo: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
    letterSpacing: "0.02em",
  },
  dashboardContent: {
    padding: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1.5rem",
    flex: 1,
    background: "#ffffff",
    borderRadius: "0 0 16px 16px",
  },
  expenseSummary: {
    background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
    borderRadius: "12px",
    padding: "1.5rem",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    transition: "transform 0.2s ease",
  },
  summaryTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#374151",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryAmount: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#1f2937",
    margin: "0.5rem 0",
    fontFamily: "'Roboto', sans-serif",
  },
  summaryPeriod: {
    fontSize: "0.85rem",
    color: "#6b7280",
    margin: 0,
    fontStyle: "italic",
  },
  budgetProgress: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  progressTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#374151",
    margin: 0,
    textTransform: "uppercase",
  },
  progressBar: {
    backgroundColor: "#e5e7eb",
    borderRadius: "12px",
    height: "12px",
    overflow: "hidden",
    border: "1px solid #d1d5db",
  },
  progressFill: {
    background: "linear-gradient(90deg, #4f46e5 0%, #10b981 100%)",
    height: "100%",
    width: "60%",
    transition: "width 1s ease-in-out",
  },
  progressText: {
    fontSize: "0.9rem",
    color: "#6b7280",
    margin: 0,
    fontWeight: 500,
  },
  transactions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  transactionsTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#374151",
    margin: 0,
    textTransform: "uppercase",
  },
  transactionList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  transactionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    color: "#4b5563",
    padding: "0.75rem",
    borderRadius: "8px",
    transition: "background-color 0.2s ease, transform 0.2s ease",
  },
  transactionIcon: {
    fontSize: "1.2rem",
    marginRight: "0.75rem",
  },
  transactionAmount: {
    fontWeight: 600,
    color: "#dc2626",
    fontFamily: "'Roboto', sans-serif",
  },
  heroTitle: {
    fontSize: "3.5rem",
    fontWeight: 800,
    marginBottom: "1.5rem",
    color: "#111827",
    lineHeight: 1.2,
  },
  heroSubtitle: {
    fontSize: "1.25rem",
    color: "#4b5563",
    marginBottom: "2.5rem",
  },
  ctaContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.75rem",
  },
  ctaButton: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    padding: "1rem 2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: 600,
    boxShadow: "0 4px 6px rgba(79, 70, 229, 0.3)",
  },
  ctaNote: {
    fontSize: "0.875rem",
    color: "#6b7280",
  },
  trustBadges: {
    display: "flex",
    gap: "1.5rem",
    marginTop: "3rem",
  },
  badge: {
    fontSize: "0.875rem",
    color: "#4b5563",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  features: {
    padding: "6rem 5%",
    backgroundColor: "#ffffff",
  },
  sectionTitle: {
    fontSize: "2.5rem",
    fontWeight: 800,
    marginBottom: "1rem",
    color: "#111827",
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: "1.125rem",
    color: "#6b7280",
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto 3rem",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  featureItem: {
    padding: "2rem",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  featureIcon: {
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  featureTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: "0.75rem",
    color: "#111827",
  },
  featureText: {
    fontSize: "1rem",
    color: "#4b5563",
  },
  howItWorks: {
    padding: "6rem 5%",
    backgroundColor: "#f9fafb",
  },
  stepsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  step: {
    padding: "2rem",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    textAlign: "center",
    position: "relative",
  },
  stepNumber: {
    width: "50px",
    height: "50px",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 auto 1.5rem",
  },
  stepTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#111827",
  },
  stepText: {
    fontSize: "1rem",
    color: "#4b5563",
  },
  testimonials: {
    padding: "6rem 5%",
    backgroundColor: "#ffffff",
  },
  testimonialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  testimonialItem: {
    padding: "2rem",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  testimonialRating: {
    color: "#f59e0b",
    fontSize: "1.25rem",
    marginBottom: "1rem",
  },
  testimonialText: {
    fontSize: "1rem",
    color: "#4b5563",
    fontStyle: "italic",
    marginBottom: "1.5rem",
  },
  testimonialAuthor: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  authorAvatar: {
    width: "50px",
    height: "50px",
    backgroundColor: "#e5e7eb",
    borderRadius: "50%",
  },
  authorName: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  },
  authorTitle: {
    fontSize: "0.875rem",
    color: "#6b7280",
    margin: 0,
  },
  pricing: {
    padding: "6rem 5%",
    backgroundColor: "#f9fafb",
  },
  pricingCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  pricingCard: {
    padding: "2.5rem 2rem",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    textAlign: "center",
    position: "relative",
  },
  pricingCardFeatured: {
    padding: "2.5rem 2rem",
    backgroundColor: "#4f46e5",
    borderRadius: "12px",
    boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)",
    textAlign: "center",
    position: "relative",
    transform: "scale(1.05)",
  },
  featuredBadge: {
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#10b981",
    color: "#ffffff",
    padding: "0.25rem 1rem",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  pricingTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#111827",
  },
  pricingPrice: {
    fontSize: "2.5rem",
    fontWeight: 800,
    marginBottom: "1.5rem",
    color: "#111827",
  },
  pricingPeriod: {
    fontSize: "1rem",
    color: "#6b7280",
    fontWeight: 400,
  },
  pricingFeatures: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 2rem 0",
    textAlign: "left",
  },
  pricingFeature: {
    fontSize: "0.9375rem",
    color: "#4b5563",
    padding: "0.5rem 0",
    borderBottom: "1px solid #e5e7eb",
  },
  pricingButton: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    width: "100%",
  },
  pricingButtonFeatured: {
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    width: "100%",
  },
  faq: {
    padding: "6rem 5%",
    backgroundColor: "#ffffff",
  },
  faqGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  faqItem: {
    padding: "1.5rem",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  faqQuestion: {
    fontSize: "1.125rem",
    fontWeight: 600,
    marginBottom: "0.75rem",
    color: "#111827",
  },
  faqAnswer: {
    fontSize: "1rem",
    color: "#4b5563",
  },
  finalCta: {
    padding: "6rem 5%",
    backgroundColor: "#4f46e5",
    backgroundImage: "radial-gradient(circle at top right, #6366f1, #4f46e5 70%)",
    color: "#ffffff",
  },
  finalCtaContent: {
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
  },
  finalCtaTitle: {
    fontSize: "2.5rem",
    fontWeight: 800,
    marginBottom: "1.5rem",
  },
  finalCtaText: {
    fontSize: "1.25rem",
    marginBottom: "2.5rem",
    opacity: 0.9,
  },
  finalCtaButton: {
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "none",
    padding: "1rem 2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: 600,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  finalCtaNote: {
    fontSize: "0.875rem",
    opacity: 0.8,
    marginTop: "1.5rem",
  },
  footer: {
    backgroundColor: "#111827",
    color: "#ffffff",
    padding: "4rem 5% 2rem",
  },
  footerColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "3rem",
    maxWidth: "1200px",
    margin: "0 auto 3rem",
  },
  footerColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  footerHeading: {
    fontSize: "1.125rem",
    fontWeight: 700,
    marginBottom: "1rem",
  },
  footerText: {
    fontSize: "0.9375rem",
    color: "#9ca3af",
    lineHeight: 1.6,
  },
  footerLink: {
    fontSize: "0.9375rem",
    color: "#9ca3af",
    textDecoration: "none",
  },
  socialLinks: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem",
  },
  socialLink: {
    fontSize: "0.875rem",
    color: "#9ca3af",
    textDecoration: "none",
  },
  footerBottom: {
    borderTop: "1px solid #374151",
    paddingTop: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  footerCopyright: {
    fontSize: "0.875rem",
    color: "#9ca3af",
    margin: 0,
  },
  footerLegal: {
    display: "flex",
    gap: "1.5rem",
  },
  footerLegalLink: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    textDecoration: "none",
  },
};

export default WelcomePage;
