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
// import { PhoneInput } from "@/components/ui/phone-input"; // Remplacé par Input standard

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
};

export default function Contact() : JSX.Element {
  const { toast } = useToast();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
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
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      reset();
    },
    onError: (error: unknown) => {
      toast({
        title: "Erreur d'envoi",
        description: error.message || "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <section id="contact" className="py-20 bg-coffee-dark text-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Nous Contacter
          </h2>
          <p className="text-lg text-coffee-secondary max-w-2xl mx-auto">
            Une question, une suggestion ou envie de privatiser notre espace ? Contactez-nous
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">
              <Mail className="inline mr-2 text-coffee-accent" />
              Envoyez-nous un message
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="name" className="block text-coffee-secondary font-semibold mb-2">
                  Nom complet *
                </Label>
                <Input
                  id="name"
                  {...register("name", { required: "Le nom est requis" })}
                  className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="block text-coffee-secondary font-semibold mb-2">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", { required: "L'email est requis" })}
                  className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="Ex: +33612345678"
                    type="tel"
                    className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="subject" className="block text-coffee-secondary font-semibold mb-2">
                  Sujet *
                </Label>
                <Select onValueChange={(value) => setValue("subject", value)} required>
                  <SelectTrigger className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent">
                    <SelectValue placeholder="Choisir un sujet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reservation">Question sur une réservation</SelectItem>
                    <SelectItem value="menu">Question sur le menu</SelectItem>
                    <SelectItem value="privatisation">Privatisation d'espace</SelectItem>
                    <SelectItem value="feedback">Avis et suggestions</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="message" className="block text-coffee-secondary font-semibold mb-2">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  {...register("message", { required: "Le message est requis" })}
                  rows={6}
                  placeholder="Votre message..."
                  className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                />
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={contactMutation.isPending}
                className="w-full bg-coffee-accent hover:bg-coffee-primary text-white font-semibold py-4 px-6 rounded-lg transition duration-300 transform hover:scale-105"
              >
                <Send className="mr-2 h-5 w-5" />
                {contactMutation.isPending ? "Envoi..." : "Envoyer le message"}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold mb-6">
                <MapPin className="inline mr-2 text-coffee-accent" />
                Nos Coordonnées
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">Adresse</h4>
                    <p>123 Rue du Café<br />75001 Paris, France</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">Téléphone</h4>
                    <p>01 23 45 67 89</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">Email</h4>
                    <p>contact@barista-cafe.fr</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">Horaires d'ouverture</h4>
                    <div className="space-y-1">
                      <p>Lundi - Vendredi: 8h00 - 21h00</p>
                      <p>Samedi - Dimanche: 9h00 - 22h00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold text-coffee-secondary mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                <a href="#" className="bg-coffee-accent hover:bg-coffee-secondary text-white p-3 rounded-full transition duration-300">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-coffee-accent hover:bg-coffee-secondary text-white p-3 rounded-full transition duration-300">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="bg-coffee-accent hover:bg-coffee-secondary text-white p-3 rounded-full transition duration-300">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Google Maps */}
            <div className="bg-coffee-cream rounded-lg p-4">
              <h4 className="font-semibold text-coffee-secondary mb-4">Notre Localisation</h4>
              <div className="rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.8916666666665!2d2.3522219156743005!3d48.85661007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e671d877937b0f%3A0xb975fcfa192f84d4!2sPlace%20Vend%C3%B4me%2C%2075001%20Paris%2C%20France!5e0!3m2!1sfr!2sfr!4v1649766543210!5m2!1sfr!2sfr"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation Barista Café"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
