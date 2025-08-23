import React from 'react';
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Phone, Clock, Send, Facebook, Instagram, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
};

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch
  } = useForm<ContactFormData>({
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      phone: ''
    }
  });

  const contactMutation = useMutation({
    mutationFn: (data: ContactFormData) => 
      apiRequest("/api/contact", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data});,
    onSuccess: () => {
      toast({
        title: t('contact.success.title'),
        description: t('contact.success.description'),
      });
      reset();
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: t('contact.error.title'),
        description: error.message || t('contact.error.description'),
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      await contactMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const contactInfo = {
    address: "123 Rue du Café\n75001 Paris, France",
    phone: "01 23 45 67 89",
    email: "contact@barista-cafe.fr",
    openingHours: {
      weekdays: "Lundi - Vendredi: 8h00 - 21h00",
      weekends: "Samedi - Dimanche: 9h00 - 22h00"
    }
  };

  const socialMedia = [
    { icon: Facebook, url: "#", name: "Facebook" },
    { icon: Instagram, url: "#", name: "Instagram" },
    { icon: Twitter, url: "#", name: "Twitter" }
  ];

  if (isSubmitted) {
    return (
      <section id="contact" className="py-20 bg-coffee-dark text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto bg-coffee-darker p-8 rounded-lg">
            <h2 className="text-3xl font-bold mb-6 text-coffee-accent">
              {t('contact.thanks.title'}
            </h2>
            <p className="text-lg mb-8">
              {t('contact.thanks.description'}
            </p>
            <Button 
              onClick={() => setIsSubmitted(false}
              className="bg-coffee-accent hover:bg-coffee-primary"
            >
              {t('contact.thanks.button'}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 bg-coffee-dark text-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            {t('contact.title'}
          </h2>
          <p className="text-lg text-coffee-secondary max-w-2xl mx-auto">
            {t('contact.subtitle'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">
              <Mail className="inline mr-2 text-coffee-accent" />
              {t('contact.form.title'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="block text-coffee-secondary font-semibold mb-2">
                  {t('contact.form.name'} *
                </Label>
                <Input
                  id="name"
                  {...register("name", { 
                    required: t('contact.errors.nameRequired'),
                    minLength: {
                      value: 2,
                      message: t('contact.errors.nameMinLength')
                    }
                  })}
                  className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="block text-coffee-secondary font-semibold mb-2">
                  {t('contact.form.email'} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", { 
                    required: t('contact.errors.emailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('contact.errors.emailInvalid')
                    }
                  })}
                  className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">{t('contact.form.phone'}</Label>
                <Input
                  id="phone"
                  {...register("phone", {
                    pattern: {
                      value: /^\+?[0-9\s-]+$/,
                      message: t('contact.errors.phoneInvalid')
                    }
                  })}
                  placeholder={t('contact.form.phonePlaceholder'}
                  type="tel"
                  className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="subject" className="block text-coffee-secondary font-semibold mb-2">
                  {t('contact.form.subject'} *
                </Label>
                <Select 
                  onValueChange={(value) => setValue("subject", value}
                  required
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent">
                    <SelectValue placeholder={t('contact.form.subjectPlaceholder'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reservation">{t('contact.subjects.reservation'}</SelectItem>
                    <SelectItem value="menu">{t('contact.subjects.menu'}</SelectItem>
                    <SelectItem value="privatisation">{t('contact.subjects.privatisation'}</SelectItem>
                    <SelectItem value="feedback">{t('contact.subjects.feedback'}</SelectItem>
                    <SelectItem value="other">{t('contact.subjects.other'}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="message" className="block text-coffee-secondary font-semibold mb-2">
                  {t('contact.form.message'} *
                </Label>
                <Textarea
                  id="message"
                  {...register("message", { 
                    required: t('contact.errors.messageRequired'),
                    minLength: {
                      value: 10,
                      message: t('contact.errors.messageMinLength')
                    }
                  })}
                  rows={6}
                  placeholder={t('contact.form.messagePlaceholder'}
                  className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                  disabled={isSubmitting}
                />
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-coffee-accent hover:bg-coffee-primary text-white font-semibold py-4 px-6 rounded-lg transition duration-300 transform hover:scale-105"
              >
                <Send className="mr-2 h-5 w-5" />
                {isSubmitting ? t('contact.form.sending') : t('contact.form.submit'}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold mb-6">
                <MapPin className="inline mr-2 text-coffee-accent" />
                {t('contact.info.title'}
              </h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">
                      {t('contact.info.address'}
                    </h4>
                    <p className="whitespace-pre-line">{contactInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">
                      {t('contact.info.phone'}
                    </h4>
                    <p>{contactInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">
                      {t('contact.info.email'}
                    </h4>
                    <a 
                      href={`mailto:${contactInfo.email}`}
                      className="hover:text-coffee-accent transition-colors"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">
                      {t('contact.info.hours'}
                    </h4>
                    <div className="space-y-1">
                      <p>{contactInfo.openingHours.weekdays}</p>
                      <p>{contactInfo.openingHours.weekends}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold text-coffee-secondary mb-4">
                {t('contact.social.title'}
              </h4>
              <div className="flex space-x-4">
                {socialMedia.map((social) => (
                  <a 
                    key={social.name}
                    href={social.url}
                    aria-label={social.name}
                    className="bg-coffee-accent hover:bg-coffee-secondary text-white p-3 rounded-full transition duration-300"
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                );}
              </div>
            </div>

            {/* Google Maps */}
            <div className="bg-coffee-cream rounded-lg p-4">
              <h4 className="font-semibold text-coffee-secondary mb-4">
                {t('contact.map.title'}
              </h4>
              <div className="rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.8916666666665!2d2.3522219156743005!3d48.85661007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e671d877937b0f%3A0xb975fcfa192f84d4!2sPlace%20Vend%C3%B4me%2C%2075001%20Paris%2C%20France!5e0!3m2!1sfr!2sfr!4v1649766543210!5m2!1sfr!2sfr"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t('contact.map.iframeTitle'}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;